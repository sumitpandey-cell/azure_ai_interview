import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { limiters } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    // Rate Limiting Protection
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    try {
      // 5 requests per minute per IP to prevent token spamming
      await limiters.livekit.check(null, 5, ip);
    } catch {
      return NextResponse.json(
        { error: 'Too many requests for LiveKit tokens. Please try again in a minute.' },
        { status: 429 }
      );
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Generate unique identity for the candidate
    const candidateIdentity = "candidate-" + Math.random().toString(36).substring(7);

    // Fetch session config to get avatar selection and session context
    let selectedVoice = 'alloy'; // Default voice
    let selectedAvatar = 'default'; // Default avatar ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sessionContext: any = null;

    interface SessionConfig {
      selectedVoice?: string;
      selectedAvatar?: string;
      skills?: string[];
      difficulty?: string;
      duration?: number;
      companyName?: string;
      role?: string;
      experienceLevel?: string;
      useResume?: boolean;
      company?: { name: string };
      companyInterviewConfig?: {
        companyName: string;
        role: string;
        experienceLevel: string;
        companyId?: string;
        companyTemplateId?: string;
      };
    }

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
                // Ignore setAll in Server Components
              }
            },
          },
        }
      );

      // Fetch session data
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();


      // Fetch resume content separately if enabled
      let resumeContent: string | null = null;
      const config = (session && !error && typeof session.config === 'object' && session.config !== null ? session.config : {}) as SessionConfig;
      const useResume = config.useResume !== false; // Default to true if not specified

      if (session && !error && session.user_id && useResume) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('resume_content')
          .eq('id', session.user_id)
          .single();

        resumeContent = profile?.resume_content || null;
      }

      if (session && !error) {
        if (config.selectedVoice) {
          const supportedVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar', 'fenrir', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Puck'];
          if (supportedVoices.includes(config.selectedVoice)) {
            selectedVoice = config.selectedVoice;
          }
        }

        if (config.selectedAvatar) {
          selectedAvatar = config.selectedAvatar;
        }

        const isCompanyInterview = config.companyInterviewConfig != null;
        sessionContext = {
          position: session.position,
          interviewType: session.interview_type,
          companyName: isCompanyInterview
            ? config.companyInterviewConfig!.companyName
            : (config.companyName || config.company?.name || null),
          role: isCompanyInterview
            ? config.companyInterviewConfig!.role
            : (config.role || session.position),
          experienceLevel: isCompanyInterview
            ? config.companyInterviewConfig!.experienceLevel
            : (config.experienceLevel || 'Mid'),
          skills: config.skills || [],
          difficulty: config.difficulty || 'Intermediate',
          duration: config.duration || 30,
          resumeContent: resumeContent,
          useResume: useResume
        };



        const companyId = config.companyInterviewConfig?.companyId || config.companyInterviewConfig?.companyTemplateId;
        if (isCompanyInterview && companyId) {
          const { data: questions } = await supabase
            .from('company_questions')
            .select('question_text')
            .eq('company_id', companyId)
            .limit(5);

          if (questions && questions.length > 0) {
            sessionContext.questions = questions.map(q => q.question_text);
            sessionContext.isCompanySpecific = true;
          }
        }
      } else {
        console.log('⚠️ [TOKEN_DEBUG] No session found or error occurred:', error);
      }
    }

    const roomName = sessionId || "interview-room";
    const lkUrl = process.env.LIVEKIT_URL?.trim().replace('wss://', 'https://').replace('ws://', 'http://');
    const lkKey = process.env.LIVEKIT_API_KEY?.trim();
    const lkSecret = process.env.LIVEKIT_API_SECRET?.trim();

    if (!lkUrl || !lkKey || !lkSecret) {
      throw new Error("Missing LiveKit configuration");
    }

    const roomClient = new RoomServiceClient(lkUrl!, lkKey!, lkSecret!);
    try {
      await roomClient.createRoom({
        name: roomName,
        emptyTimeout: 300,
        maxParticipants: 10,
        metadata: JSON.stringify({ sessionId, createdAt: new Date().toISOString() })
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (!error.message?.includes('already exists')) {
        console.warn(`Room creation warning:`, error);
      }
    }

    try {
      const dispatchClient = new AgentDispatchClient(lkUrl!, lkKey!, lkSecret!);
      await dispatchClient.createDispatch(roomName, 'Arjuna-Interview-AI');
    } catch (dispatchErr: unknown) {
      console.warn(`Agent dispatch warning:`, dispatchErr);
    }

    const ttl = 3600; // 1 hour token validity

    const tokenMetadata = {
      selectedVoice,
      selectedAvatar,
      sessionId,
      sessionContext
    };


    const token = new AccessToken(
      lkKey!,
      lkSecret!,
      {
        identity: candidateIdentity,
        ttl: ttl,
        metadata: JSON.stringify(tokenMetadata)
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;

    return NextResponse.json({
      url: lkUrl!,
      token: jwt,
      expiresAt: expiresAt
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
