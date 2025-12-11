import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Generate unique identity for the candidate
    const candidateIdentity = "candidate-" + Math.random().toString(36).substring(7);

    // Fetch session config to get avatar selection and session context
    let selectedVoice = 'alloy'; // Default voice
    let sessionContext: any = null;

    if (sessionId) {
      // Initialize Supabase Client with cookies to authenticate as user
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      );

      // Fetch full session data directly using authenticated client
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (session && !error) {
        const config = typeof session.config === 'object' && session.config !== null ? session.config as any : {};

        if (config.selectedVoice) {
          const supportedVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];
          if (supportedVoices.includes(config.selectedVoice)) {
            selectedVoice = config.selectedVoice;
            console.log(`✓ Using voice from session config: ${selectedVoice}`);
          } else {
            console.warn(`⚠️ Invalid voice '${config.selectedVoice}' in config. Falling back to default 'alloy'.`);
            selectedVoice = 'alloy';
          }
        }

        // Prepare session context for the AI agent
        sessionContext = {
          position: session.position,
          interviewType: session.interview_type,
          companyName: config.companyName || config.company?.name || 'Unknown Company',
          skills: config.skills || [],
          difficulty: config.difficulty || 'Intermediate',
          experienceLevel: config.experienceLevel || 'Mid-level',
          duration: config.duration || 30
        };
        console.log("✅ Session context prepared for agent:", sessionContext);
      } else {
        console.warn(`⚠️ Session not found for ID: ${sessionId}`, error);
      }
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: candidateIdentity,
        metadata: JSON.stringify({
          selectedVoice,
          sessionId,
          sessionContext
        })
      }
    );

    token.addGrant({
      roomJoin: true,
      room: sessionId || "interview-room",
      canPublish: true,
      canSubscribe: true,
    });

    return NextResponse.json({
      url: process.env.LIVEKIT_URL!,
      token: await token.toJwt(),
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

