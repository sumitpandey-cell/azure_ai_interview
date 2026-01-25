# Cashfree Payment Integration Guide - Arjuna AI

This guide outlines the steps to integrate Cashfree PG into the AI Interview platform using Next.js App Router and Supabase.

## 🏗 Architecture
1. **Frontend**: Pricing page triggers order creation.
2. **Backend**: Next.js API route (`/api/payments/create-order`) calls Cashfree API to generate an `order_id` and `payment_session_id`.
3. **Checkout**: User is redirected to Cashfree's Hosted Checkout or uses the SDK for Embedded Checkout.
4. **Verification**: 
   - **Sync**: Redirect to `/api/payments/verify` after payment.
   - **Async (Crucial)**: Webhook sent to `/api/webhooks/cashfree` to update user subscription in Supabase.

---

## 🛠 Step 1: Install Dependencies
Install the official Cashfree SDK for Node.js.
```bash
pnpm add cashfree-pg
```

---

## 🔐 Step 2: Environment Variables
Ensure these are in your `.env` file (already added):
```env
CASHFREE_APP_ID=...
CASHFREE_SECRET_KEY=...
CASHFREE_API_VERSION=2023-08-01
CASHFREE_ENV=sandbox # Use 'production' for live
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Your base URL
```

---

## 📡 Step 3: Create Order API (`src/app/api/payments/create-order/route.ts`)
This endpoint will be called from the pricing page when a user selects a plan.

```typescript
import { Cashfree } from "cashfree-pg";
import { NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

Cashfree.XClientId = process.env.CASHFREE_APP_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = process.env.CASHFREE_ENV === "production" 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

export async function POST(req: Request) {
    try {
        const { planId, amount, customerName, customerEmail, customerPhone } = await req.json();
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const request = {
            order_amount: amount,
            order_currency: "INR",
            order_id: `order_${Date.now()}_${user.id.slice(0, 8)}`,
            customer_details: {
                customer_id: user.id,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
            },
            order_meta: {
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify?order_id={order_id}`,
                notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cashfree`,
            },
            order_note: `Subscription for ${planId}`,
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Cashfree Order Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
```

---

## ✅ Step 4: Verification API (`src/app/api/payments/verify/route.ts`)
Handles the redirect after payment.

```typescript
import { Cashfree } from "cashfree-pg";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    try {
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId!);
        const payment = response.data[0];

        if (payment.payment_status === "SUCCESS") {
            // Success! Redirect to dashboard or success page
            redirect("/dashboard?payment=success");
        } else {
            redirect("/pricing?payment=failed");
        }
    } catch (error) {
        redirect("/pricing?payment=error");
    }
}
```

---

## ⚓ Step 5: Webhook Handler (`src/app/api/webhooks/cashfree/route.ts`)
**Critical for Security.** This ensures subscriptions are updated even if the user closes the browser before redirecting.

```typescript
import { Cashfree } from "cashfree-pg";
import { NextResponse } from "next/server";
import { subscriptionService } from "@/services/subscription.service";

export async function POST(req: Request) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    try {
        // Verify Webhook Signature
        Cashfree.PGVerifyWebhookSignature(signature!, rawBody, timestamp!);
        
        const event = JSON.parse(rawBody);
        if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
            const { order, customer_details } = event.data;
            const userId = customer_details.customer_id;
            const planId = order.order_note.split("for ")[1]; 

            // Check if subscription exists
            const subscription = await subscriptionService.getSubscription(userId);
            
            if (subscription) {
                await subscriptionService.updateSubscriptionPlan(userId, planId);
            } else {
                await subscriptionService.createSubscription(userId, planId);
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (err) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
}
```

---

## 💻 Step 6: Frontend Integration (`src/app/pricing/page.tsx`)
Update `handleSubscribe` to trigger the flow.

```typescript
const handleSubscribe = async (plan: Plan) => {
    setIsLoading(true);
    try {
        const response = await fetch("/api/payments/create-order", {
            method: "POST",
            body: JSON.stringify({
                planId: plan.id,
                amount: plan.price,
                customerName: user.full_name,
                customerEmail: user.email,
                customerPhone: "9999999999", // Get from user profile
            }),
        });
        
        const { payment_session_id } = await response.json();
        
        // Initialize Cashfree SDK
        const cashfree = await load({ mode: "sandbox" });
        await cashfree.checkout({
            paymentSessionId: payment_session_id,
            redirectTarget: "_self", 
        });
    } catch (error) {
        toast.error("Payment initialization failed");
    } finally {
        setIsLoading(false);
    }
};
```

---

## 🧪 Testing Checklist
1. [ ] Create Test Order (Sandbox)
2. [ ] Complete payment using Test Cards (Success)
3. [ ] Verify Redirect works
4. [ ] Verify Webhook updates Supabase DB
5. [ ] Handle Failed Payments (UI feedback)

## 📎 Resources
- [Cashfree Documentation](https://docs.cashfree.com/docs/pg-sdk-integration)
- [Test Credentials](https://docs.cashfree.com/docs/testing-upi-on-sandbox)
