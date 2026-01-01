import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "@/services";
import { limiters } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    try {
      await limiters.supabase.check(null, 5, `fix-sessions-${ip}`);
    } catch (e) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log("🔧 Fixing stuck sessions for user:", userId);

    // Fix stuck sessions
    const result = await interviewService.fixStuckSessions(userId);

    console.log("✅ Fixed stuck sessions:", result);

    return NextResponse.json({
      success: true,
      fixed: result.fixed,
      errors: result.errors,
      message: `Fixed ${result.fixed} stuck sessions`
    });
  } catch (error) {
    console.error("❌ Error fixing stuck sessions:", error);
    return NextResponse.json(
      {
        error: "Failed to fix stuck sessions",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}