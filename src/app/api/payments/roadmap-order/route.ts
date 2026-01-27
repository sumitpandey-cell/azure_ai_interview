import { NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";
import { cashfree } from "@/lib/cashfree";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, customerName, customerEmail, customerPhone } = body;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const request = {
            order_amount: amount || 99,
            order_currency: "INR",
            order_id: `roadmap_${Date.now()}_${user.id.slice(0, 8)}`,
            customer_details: {
                customer_id: user.id,
                customer_name: customerName || user.user_metadata?.full_name || "Customer",
                customer_email: customerEmail || user.email || "",
                customer_phone: customerPhone || "9999999999",
            },
            order_meta: {
                return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/verify?order_id={order_id}`,
                notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/cashfree`,
            },
            order_note: `Roadmap Purchase`,
        };

        const response = await cashfree.PGCreateOrder(request);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Cashfree Roadmap Order Error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: "Failed to create roadmap order", details: error.response?.data || error.message },
            { status: 500 }
        );
    }
}
