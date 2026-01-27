import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { cashfree } from "@/lib/cashfree";
import { subscriptionService } from "@/services/subscription.service";
import { createAdminClient } from "@/integrations/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
        return NextResponse.redirect(new URL("/pricing?payment=invalid", req.url));
    }

    try {
        // 1. Fetch Order details to get customer_id and planId
        const orderResponse = await cashfree.PGFetchOrder(orderId);
        const order = orderResponse.data;

        // 2. Fetch Payments for this order to verify success
        const paymentsResponse = await cashfree.PGOrderFetchPayments(orderId);
        const payments = paymentsResponse.data;

        // Find specific payment statuses
        const successPayment = payments?.find((p: any) => p.payment_status === "SUCCESS");
        const pendingPayment = payments?.find((p: any) => p.payment_status === "PENDING");
        const cancelledPayment = payments?.find((p: any) => p.payment_status === "CANCELLED");
        const failedPayment = payments?.find((p: any) => p.payment_status === "FAILED");

        if (successPayment && order) {
            const userId = order.customer_details?.customer_id;
            const note = order.order_note || "";

            if (note.includes("Roadmap Purchase")) {
                console.log(`✅ Verify: Roadmap payment success for user ${userId}`);
                // No need to update DB here, the frontend will see the success and call generateRoadmap(paymentId)
                return NextResponse.redirect(new URL(`/roadmap?payment=success&order_id=${orderId}`, req.url));
            }

            const planId = note.includes("Subscription for ") ? note.split("Subscription for ")[1] : null;

            if (userId && planId) {
                console.log(`✅ Verify: Processing purchase for user ${userId}, plan ${planId}`);
                const supabase = await createAdminClient();
                // createSubscription now handles: 1. Fetching plan, 2. Updating credits via RPC, 3. Creating history record
                await subscriptionService.createSubscription(userId, planId, supabase);
            }
            return NextResponse.redirect(new URL("/dashboard?payment=success&refresh=true", req.url));
        } else if (pendingPayment) {
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
