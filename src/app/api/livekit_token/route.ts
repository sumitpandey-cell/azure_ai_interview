import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
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
    let selectedAvatar = 'default'; // Default avatar ID
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
          const supportedVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar', 'fenrir', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Puck'];
          if (supportedVoices.includes(config.selectedVoice)) {
            selectedVoice = config.selectedVoice;
            console.log(`✓ Using voice from session config: ${selectedVoice}`);
          } else {
            console.warn(`⚠️ Invalid voice '${config.selectedVoice}' in config. Falling back to default 'alloy'.`);
            selectedVoice = 'alloy';
          }
        }

        // Extract selected avatar ID
        if (config.selectedAvatar) {
          selectedAvatar = config.selectedAvatar;
          console.log(`✓ Using avatar from session config: ${selectedAvatar}`);
        }

        // Prepare session context for the AI agent
        // Check if this is a company-specific interview
        const isCompanyInterview = config.companyInterviewConfig != null;

        sessionContext = {
          position: session.position,
          interviewType: session.interview_type,
          // For company interviews, use companyInterviewConfig; otherwise fallback to direct config
          companyName: isCompanyInterview
            ? config.companyInterviewConfig.companyName
            : (config.companyName || config.company?.name || null),
          role: isCompanyInterview
            ? config.companyInterviewConfig.role
            : (config.role || session.position),
          experienceLevel: isCompanyInterview
            ? config.companyInterviewConfig.experienceLevel
            : (config.experienceLevel || 'Mid'),
          skills: config.skills || [],
          difficulty: config.difficulty || 'Intermediate',
          duration: config.duration || 30
        };

        // If this is a company-specific interview, fetch questions from DB
        const companyId = config.companyInterviewConfig?.companyId || config.companyInterviewConfig?.companyTemplateId;

        if (isCompanyInterview && companyId) {
          const difficulty = sessionContext.difficulty || 'Medium';
          console.log(`Fetching questions for company: ${companyId}, difficulty: ${difficulty}`);

          // Fetch questions for this company from Supabase
          const { data: questions, error: questionsError } = await supabase
            .from('company_questions')
            .select('question_text')
            .eq('company_id', companyId)
            //.eq('difficulty', difficulty) // Optional: strict difficulty matching, or fallback
            .limit(5);

          if (!questionsError && questions && questions.length > 0) {
            const questionTexts = questions.map(q => q.question_text);
            sessionContext.questions = questionTexts;
            sessionContext.isCompanySpecific = true;
            console.log(`✓ Fetched ${questions.length} company-specific questions`);
          } else {
            console.warn("Could not fetch company questions", questionsError);
          }
        } else if (isCompanyInterview && !companyId) {
          console.warn("⚠️ Company interview detected but no companyId/companyTemplateId found in config");
        }


        console.log("✅ Session context prepared for agent:", sessionContext);
      } else {
        console.warn(`⚠️ Session not found for ID: ${sessionId}`, error);
      }
    }
    console.log("✅ Session context prepared for agent:", sessionContext);

    // Create or update room with agent dispatch configuration
    const roomName = sessionId || "interview-room";
    const roomClient = new RoomServiceClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    try {
      // Try to create room with agent dispatch enabled
      await roomClient.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 10,
        metadata: JSON.stringify({
          sessionId,
          createdAt: new Date().toISOString()
        })
      });
      console.log(`✅ Room created: ${roomName}`);
    } catch (err: any) {
      // Room might already exist, that's okay
      if (err.message?.includes('already exists')) {
        console.log(`Room already exists: ${roomName}`);
      } else {
        console.warn(`Room creation warning:`, err.message);
      }
    }

    // Always dispatch agent (whether room is new or existing)
    try {
      const dispatchClient = new AgentDispatchClient(
        process.env.LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!
      );

      await dispatchClient.createDispatch(roomName, 'Arjuna-Interview-AI');
      console.log(`✅ Agent dispatched to room: ${roomName}`);
    } catch (dispatchErr: any) {
      console.warn(`⚠️ Could not dispatch agent:`, dispatchErr.message || dispatchErr);
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: candidateIdentity,
        metadata: JSON.stringify({
          selectedVoice,
          selectedAvatar,
          sessionId,
          sessionContext
        })
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
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

