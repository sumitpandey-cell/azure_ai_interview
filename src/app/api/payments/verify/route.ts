import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { cashfree } from "@/lib/cashfree";
import { subscriptionService } from "@/services/subscription.service";
import { createAdminClient } from "@/integrations/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    let orderId = searchParams.get("order_id");

    // Clean orderId - remove trailing question marks or other junk that gateways might append
    if (orderId) {
        orderId = orderId.replace(/[?&].*$/, '').trim();
    }

    console.log("🔍 Verifying Payment for Order ID:", orderId);

    if (!orderId) {
        console.error("❌ No Order ID provided in verification request");
        return NextResponse.redirect(new URL("/pricing?payment=invalid", req.url));
    }

    try {
        // 1. Fetch Order details to get customer_id and planId
        console.log("📡 Fetching order details from Cashfree...");
        const orderResponse = await cashfree.PGFetchOrder(orderId);
        const order = orderResponse.data;
        console.log("📦 Order Details:", JSON.stringify(order, null, 2));

        // 2. Fetch Payments for this order to verify success
        console.log("📡 Fetching payment details from Cashfree...");
        const paymentsResponse = await cashfree.PGOrderFetchPayments(orderId);
        const payments = paymentsResponse.data;
        console.log("💳 Payments for Order:", JSON.stringify(payments, null, 2));

        // Find specific payment statuses
        const successPayment = payments?.find((p: any) => p.payment_status === "SUCCESS");
        const pendingPayment = payments?.find((p: any) => p.payment_status === "PENDING");
        const cancelledPayment = payments?.find((p: any) => p.payment_status === "CANCELLED");
        const failedPayment = payments?.find((p: any) => p.payment_status === "FAILED");

        if (successPayment && order) {
            const userId = order.customer_details?.customer_id;
            const note = order.order_note || "";
            console.log(`✅ Success Payment Found! UserID: ${userId}, Note: ${note}`);

            if (note.includes("Roadmap Purchase")) {
                console.log(`✅ Verify: Roadmap payment success for user ${userId}`);
                return NextResponse.redirect(new URL(`/roadmap?payment=success&order_id=${orderId}`, req.url));
            }

            const planId = note.includes("Subscription for ") ? note.split("Subscription for ")[1] : null;

            if (userId && planId) {
                console.log(`✅ Verify: Processing purchase for user ${userId}, plan ${planId}`);
                const supabase = await createAdminClient();
                const result = await subscriptionService.createSubscription(userId, planId, supabase);
                if (result) {
                    console.log(`✅ Credits added and record created for ${userId}`);
                } else {
                    console.error(`❌ Failed to create subscription record for ${userId}`);
                }
            } else {
                console.error(`❌ Missing UserID (${userId}) or PlanID (${planId}) from order note`);
            }
            return NextResponse.redirect(new URL("/dashboard?payment=success&refresh=true", req.url));
        } else {
            console.log("⚠️ No successful payment found among order payments");
        }

        if (pendingPayment) {
            const reason = pendingPayment.payment_message || "Processing with bank";
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/dashboard";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=pending&reason=${encodeURIComponent(reason)}`, req.url));
        } else if (cancelledPayment) {
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/pricing";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=cancelled`, req.url));
        } else if (failedPayment) {
            const reason = failedPayment.payment_message || "Transaction declined";
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/pricing";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=failed&reason=${encodeURIComponent(reason)}`, req.url));
        } else {
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/pricing";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=failed`, req.url));
        }
    } catch (error: any) {
        console.error("Cashfree Verification Error:", error);
        return NextResponse.redirect(new URL("/pricing?payment=error", req.url));
    }
}
