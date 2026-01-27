import { NextResponse } from "next/server";
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

    if (!orderId) {
        console.error("❌ No Order ID provided in verification request");
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
        const successPayment = payments?.find((p: unknown) => (p as { payment_status?: string }).payment_status === "SUCCESS");
        const pendingPayment = payments?.find((p: unknown) => (p as { payment_status?: string }).payment_status === "PENDING");
        const cancelledPayment = payments?.find((p: unknown) => (p as { payment_status?: string }).payment_status === "CANCELLED");
        const failedPayment = payments?.find((p: unknown) => (p as { payment_status?: string }).payment_status === "FAILED");

        if (successPayment && order) {
            const userId = order.customer_details?.customer_id;
            const note = order.order_note || "";

            if (note.includes("Roadmap Purchase")) {
                return NextResponse.redirect(new URL(`/roadmap?payment=success&order_id=${orderId}`, req.url));
            }

            const planId = note.includes("Subscription for ") ? note.split("Subscription for ")[1].trim() : null;

            if (userId && planId) {
                const supabase = await createAdminClient();
                const result = await subscriptionService.createSubscription(userId, planId, supabase);
                if (!result) {
                    console.error(`❌ Failed to create subscription record for ${userId}`);
                }
            } else {
                console.error(`❌ Missing UserID (${userId}) or PlanID (${planId}) from order note`);
            }
            return NextResponse.redirect(new URL("/dashboard?payment=success&refresh=true", req.url));
        }

        if (pendingPayment) {
            const reason = (pendingPayment as { payment_message?: string }).payment_message || "Processing with bank";
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/dashboard";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=pending&reason=${encodeURIComponent(reason)}`, req.url));
        } else if (cancelledPayment) {
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/pricing";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=cancelled`, req.url));
        } else if (failedPayment) {
            const reason = (failedPayment as { payment_message?: string }).payment_message || "Transaction declined";
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/pricing";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=failed&reason=${encodeURIComponent(reason)}`, req.url));
        } else {
            const note = order?.order_note || "";
            const redirectPath = note.includes("Roadmap Purchase") ? "/roadmap" : "/pricing";
            return NextResponse.redirect(new URL(`${redirectPath}?payment=failed`, req.url));
        }
    } catch (err: unknown) {
        console.error(err);
        return NextResponse.redirect(new URL("/pricing?payment=error", req.url));
    }
}
