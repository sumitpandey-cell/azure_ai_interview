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
        console.log("🔔 Cashfree Webhook Received:", event.type);

        if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
            const { order, customer_details } = event.data;
            const userId = customer_details.customer_id;

            const note = order.order_note || "";
            const planId = note.includes("Subscription for ") ? note.split("Subscription for ")[1] : null;

            if (userId && planId) {
                console.log(`✅ Webhook: Payment success for user ${userId}, plan ${planId}`);

                // Use admin client for webhooks as there is no user session
                const supabase = await createAdminClient();

                // Create subscription record (adds credits + creates purchase history)
                await subscriptionService.createSubscription(userId, planId, supabase);
                console.log(`✅ Credits added and purchase recorded for user ${userId}`);
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (err: any) {
        console.error("❌ Cashfree Webhook Error:", err.message);
        return NextResponse.json({ error: "Invalid signature or processing error" }, { status: 400 });
    }
}
