import { NextResponse } from 'next/server';

export async function POST() {
    // Placeholder for Razorpay integration
    return NextResponse.json(
        {
            message: 'Payment integration coming soon!',
            status: 'pending',
            info: 'For now, you can generate additional roadmaps for free while we implement payment processing.'
        },
        { status: 200 }
    );
}
