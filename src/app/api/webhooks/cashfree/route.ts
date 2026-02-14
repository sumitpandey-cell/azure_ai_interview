import { NextResponse } from "next/server";
import { subscriptionService } from "@/services/subscription.service";
import { cashfree } from "@/lib/cashfree";
import { createAdminClient } from "@/integrations/supabase/server";

export async function POST(req: Request) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
        return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    try {
        // Verify Webhook Signature
        cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);

        const event = JSON.parse(rawBody);

        if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
            const { order, customer_details } = event.data;
            const userId = customer_details.customer_id;
            const cleanOrderId = order.order_id.replace(/[?&].*$/, '').trim();
            const orderId = cleanOrderId; // Keep variable name for rest of logic

            if (!userId || !orderId) {
                console.error("❌ Webhook: Missing userId or orderId", { userId, orderId });
                return NextResponse.json({ status: "error", message: "Missing required fields" });
            }

            const note = order.order_note || "";
            const supabase = await createAdminClient();

            // Case 1: Subscription Purchase
            if (note.includes("Subscription for ")) {
                const planId = note.split("Subscription for ")[1].trim();
                console.log(`ℹ️ Webhook: Processing subscription for ${userId}, order ${orderId}`);

                const result = await subscriptionService.createSubscription(userId, planId, orderId, supabase);
                if (!result) {
                    console.error(`❌ Webhook: Failed to record subscription purchase for user ${userId}`);
                }
            }
            // Case 2: Roadmap Purchase
            else if (note.includes("Roadmap Purchase")) {
                console.log(`ℹ️ Webhook: Processing roadmap purchase for ${userId}, order ${orderId}`);

                // Update roadmap payment status in DB
                const { error: roadmapError } = await supabase
                    .from('learning_roadmaps')
                    .update({
                        payment_status: 'completed',
                        is_paid: true,
                        payment_id: orderId
                    })
                    .eq('user_id', userId)
                    .eq('payment_status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (roadmapError) {
                    console.error("❌ Webhook: Failed to update roadmap status:", roadmapError);
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (err: unknown) {
        console.error("❌ Cashfree Webhook Error:", (err as Error).message);
        return NextResponse.json({ error: "Invalid signature or processing error" }, { status: 400 });
    }
}
