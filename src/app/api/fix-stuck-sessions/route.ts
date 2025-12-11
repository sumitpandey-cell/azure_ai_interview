import { NextRequest, NextResponse } from "next/server";
import { interviewService } from "@/services";

export async function POST(request: NextRequest) {
  try {
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