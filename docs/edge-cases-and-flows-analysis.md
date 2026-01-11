# 🔍 Comprehensive Edge Cases & Flow Analysis
## Interview Application - Start to End

**Analysis Date:** 2026-01-11  
**Reviewer:** Senior Developer Review  
**Scope:** Complete interview lifecycle from session creation to report generation

---

## 📋 Table of Contents
1. [Critical Flows Overview](#critical-flows-overview)
2. [Session Creation & Start Interview](#1-session-creation--start-interview)
3. [Setup & Hardware Configuration](#2-setup--hardware-configuration)
4. [Live Interview Session](#3-live-interview-session)
5. [Session Completion & Feedback](#4-session-completion--feedback)
6. [Report Generation & Display](#5-report-generation--display)
7. [Subscription & Usage Tracking](#6-subscription--usage-tracking)
8. [Database & State Management](#7-database--state-management)
9. [Critical Edge Cases Matrix](#critical-edge-cases-matrix)
10. [Priority Recommendations](#priority-recommendations)

---

## Critical Flows Overview

```
┌─────────────────┐
│ Start Interview │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Setup Page     │ ← Hardware checks, Avatar selection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Live Interview │ ← LiveKit connection, Real-time tracking
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Complete      │ ← Threshold checks, Data persistence
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Report Page    │ ← Feedback generation, Polling
└─────────────────┘
```

---

## 1. Session Creation & Start Interview

### 🔴 Critical Edge Cases

#### 1.1 **Concurrent Session Conflict**
**Location:** `src/app/start-interview/page.tsx:238-254`

```typescript
const existingSessions = await interviewService.getInProgressSessions(user.id);
const sameDomainSession = existingSessions?.find(s =>
    s.position.toLowerCase() === values.position.toLowerCase() &&
    s.interview_type.toLowerCase() === values.interviewType.toLowerCase()
);
```

**Issues:**
- ❌ **Race Condition:** Two tabs can create sessions simultaneously before either can detect the other
- ❌ **Case Sensitivity:** Position comparison uses `toLowerCase()` but doesn't trim whitespace
- ⚠️ **Partial Match:** "Frontend Developer" vs "Senior Frontend Developer" not handled
- ⚠️ **Network Delay:** Dialog may show after session already created in another tab

**Impact:** Users can have multiple in-progress sessions for the same position/type

**Recommendations:**
```typescript
// Add database constraint
ALTER TABLE interview_sessions 
ADD CONSTRAINT unique_active_session 
UNIQUE (user_id, position, interview_type, status) 
WHERE status = 'in_progress';

// Client-side: Add session lock with timestamp
const sessionLock = {
  userId: user.id,
  position: values.position.trim().toLowerCase(),
  type: values.interviewType.trim().toLowerCase(),
  timestamp: Date.now()
};
sessionStorage.setItem('session_creating', JSON.stringify(sessionLock));
```

#### 1.2 **Insufficient Balance Check**
**Location:** `src/app/start-interview/page.tsx:224-236`

```typescript
const usage = await subscriptionService.checkUsageLimit(user.id);
if (usage.remainingMinutes < 120) { // 120 seconds, not minutes!
```

**Issues:**
- 🐛 **Variable Naming Bug:** `remainingMinutes` actually contains SECONDS (see subscription.service.ts:197)
- ❌ **Minimum not enforced:** User can start with 119 seconds remaining but interview requires 120s minimum
- ⚠️ **No transaction lock:** Balance can change between check and session creation

**Impact:** Users can start interviews they can't complete

**Recommendations:**
```typescript
// Fix naming and add proper minimum
const usage = await subscriptionService.checkUsageLimit(user.id);
const MINIMUM_REQUIRED_SECONDS = 120;

if (usage.remainingSeconds < MINIMUM_REQUIRED_SECONDS) {
  toast.error("Insufficient balance", {
    description: `You need at least ${MINIMUM_REQUIRED_SECONDS / 60} minutes to start.`,
    action: { label: "Upgrade", onClick: () => router.push("/pricing") }
  });
  return;
}

// Reserve time on session creation
await subscriptionService.reserveTime(user.id, MINIMUM_REQUIRED_SECONDS);
```

#### 1.3 **File Upload Parsing**
**Location:** `src/app/start-interview/page.tsx:149-194`

```typescript
if (fileExtension === 'txt') {
    const text = await file.text();
    form.setValue('jobDescription', text);
} else {
    // For PDF and DOCX, simulation only!
    setTimeout(() => {
        form.setValue('jobDescription', `Attached file: ${file.name}\n(Content from ${ext} parsing payload)`);
    }, 1500);
}
```

**Issues:**
- ⚠️ **Not Implemented:** PDF/DOCX parsing is simulated, not real
- ❌ **No validation:** TXT files can be any size or encoding
- ❌ **Missing error states:** What if file is corrupted?
- ⚠️ **Character encoding:** No handling for non-UTF8 files

**Impact:** Job descriptions from PDF/DOCX are fake placeholders

**Recommendations:**
- Implement server-side parsing API endpoint
- Add file hash verification
- Validate file content before accepting
- Add progress indicator for large files

#### 1.4 **Skills Auto-suggestion**
**Location:** `src/app/start-interview/page.tsx:204-214`

```typescript
const handleRoleSelection = (role: string) => {
    const suggestedSkills = ROLE_SKILLS[role] || [];
    setSkillsList(prev => Array.from(new Set([...prev, ...suggestedSkills])));
};
```

**Issues:**
- ⚠️ **Duplicate handling:** Relies on Set but case-sensitive ("React" vs "react")
- ❌ **No limit:** Users can add unlimited skills, could overwhelm AI
- ⚠️ **Special characters:** No sanitization of skill names

---

## 2. Setup & Hardware Configuration

### 🔴 Critical Edge Cases

#### 2.1 **Camera/Mic Permission Handling**
**Location:** `src/app/interview/[sessionId]/setup/page.tsx:136-185`

```typescript
const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!isHttps && !isLocalhost) {
            setCameraError('HTTPS required for camera access on mobile devices');
        }
        return;
    }
    const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true, audio: true
    });
};
```

**Issues:**
- ❌ **Mic Required but Camera Optional:** User can proceed without camera BUT mic is mandatory (line 236)
  - However, `startCamera()` requests BOTH video AND audio
  - If user denies camera, they ALSO lose audio
- ❌ **No separate audio-only path:** Should have `startMic()` function
- ⚠️ **Permission persistence:** No check if permissions were previously denied
- ⚠️ **Browser compatibility:** No fallback for older browsers

**Impact:** Users who want audio-only interviews can't proceed

**Recommendations:**
```typescript
const requestMicrophoneOnly = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicOn(true);
        // Store stream for later use
        return stream;
    } catch (error) {
        handleMicError(error);
    }
};

const requestCamera = async () => {
    try {
        // Request video separately, reuse existing audio if available
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: !isMicOn // Only request audio if we don't have it yet
        });
        setIsCameraOn(true);
        return stream;
    } catch (error) {
        // Don't fail mic if camera fails
        handleCameraError(error);
    }
};
```

#### 2.2 **LiveKit Token Pre-fetching**
**Location:** `src/app/interview/[sessionId]/setup/page.tsx:271-287`

```typescript
const tokenResponse = await fetch(`/api/livekit_token?sessionId=${sessionId}`);
if (tokenResponse.ok) {
    sessionStorage.setItem('livekit_prefetched_token', JSON.stringify({
        url, token, timestamp: Date.now()
    }));
}
```

**Issues:**
- ⚠️ **5-minute TTL hardcoded:** Token expires after 5 minutes (checked in live/page.tsx:104)
  - What if user sits on setup page for 6 minutes?
- ❌ **No token refresh:** If token expires, live page will fetch new one but wastes the pre-fetch effort
- ⚠️ **Race condition:** User could click Start before token finishes fetching
- ❌ **Error swallowed:** If token fetch fails, user proceeds anyway (line 286 `console.warn`)

**Impact:** Delayed connection on live page, potential token expiry

**Recommendations:**
```typescript
// Add token TTL validation
const TOKEN_TTL_MS = 5 * 60 * 1000;
const TOKEN_BUFFER_MS = 30 * 1000; // Refresh if less than 30s remaining

const validateAndRefreshToken = async (cachedToken: any) => {
    const age = Date.now() - cachedToken.timestamp;
    if (age > TOKEN_TTL_MS - TOKEN_BUFFER_MS) {
        console.log('Token expired or expiring soon, refreshing...');
        return await fetchFreshToken();
    }
    return cachedToken;
};

// Block navigation until token is ready
const handleStart = async () => {
    setIsLoading(true);
    const token = await ensureTokenReady();
    if (!token) {
        toast.error("Failed to prepare session. Please try again.");
        setIsLoading(false);
        return;
    }
    router.replace(`/interview/${sessionId}/live?mic=${isMicOn}&camera=${isCameraOn}`);
};
```

#### 2.3 **Session State Check**
**Location:** `src/app/interview/[sessionId]/setup/page.tsx:115-120`

```typescript
if (sessionData.status === 'completed') {
    toast.info("This interview session has already been completed.");
    router.replace('/dashboard');
    return;
}
```

**Issues:**
- ✅ **Good:** Prevents re-entering completed sessions
- ⚠️ **Missing check:** No validation for session ownership (user_id verification)
  - User A could access User B's session ID via URL manipulation
- ❌ **No abandoned session handling:** If session status is 'abandoned', what happens?

**Recommendations:**
```typescript
// Add ownership verification
if (sessionData.user_id !== user?.id) {
    toast.error("Unauthorized: This session belongs to another user");
    router.replace('/dashboard');
    return;
}

// Handle all session states
switch (sessionData.status) {
    case 'completed':
        router.replace(`/interview/${sessionId}/report`);
        break;
    case 'abandoned':
        toast.warning("This session was abandoned. Starting fresh...");
        // Optionally allow restart
        break;
    case 'in_progress':
        // Continue normally
        break;
    default:
        toast.error("Invalid session state");
        router.replace('/dashboard');
}
```

---

## 3. Live Interview Session

### 🔴 Critical Edge Cases

#### 3.1 **Duration Tracking & Race Conditions**
**Location:** `src/app/interview/[sessionId]/live/page.tsx:143-184`

**Multiple tracking mechanisms:**
```typescript
// 1. Cleanup on component unmount (lines 144-184)
useEffect(() => {
    return () => {
        if (sessionSegmentStart.current && !isEndingSession.current) {
            // Save resumption WITHOUT awaiting
            interviewService.createCompletedResumption(...);
            interviewService.updateSession(...);
            subscriptionService.trackUsage(...);
        }
    };
}, [currentSessionId]);

// 2. onDisconnected handler (lines 320-366)
onDisconnected={async () => {
    if (isEndingSession.current) return;
    await interviewService.createCompletedResumption(...);
    await interviewService.updateSession(...);
    await subscriptionService.trackUsage(...);
}

// 3. handleEndSession (lines 190-260)
handleEndSession = async () => {
    if (isEndingSession.current) return;
    isEndingSession.current = true;
    await interviewService.updateSession(...);
    await subscriptionService.trackUsage(...);
}
```

**Issues:**
- ❌ **Triple tracking:** Duration can be saved 3 times in edge cases:
  1. User clicks "End" → handleEndSession runs
  2. LiveKit disconnects → onDisconnected runs (should be prevented by isEndingSession flag)
  3. User closes tab → Cleanup effect runs (fire-and-forget, no flag check possible)
- ❌ **Fire-and-forget in cleanup:** Promises not awaited, can fail silently
- ⚠️ **Clock skew:** Client timestamp used for duration calculation
  - If user's system time changes during interview, duration is wrong
- ❌ **No server-side validation:** Server doesn't verify total duration matches sum of resumptions

**Impact:** 
- Duplicate usage charges
- Incorrect interview duration
- Lost duration data on network failures

**Recommendations:**
```typescript
// Server-side atomic duration tracking
// Create new API endpoint: /api/interview/track-duration
app.post('/api/interview/track-duration', async (req, res) => {
    const { sessionId, durationSeconds, segmentId } = req.body;
    
    // Use database transaction
    const result = await supabase.rpc('atomic_track_duration', {
        session_id: sessionId,
        duration_sec: durationSeconds,
        segment_id: segmentId,
        idempotency_key: `${sessionId}-${segmentId}-${Date.now()}`
    });
    
    return res.json(result);
});

// Client: Send heartbeat every 30 seconds
const sendHeartbeat = async () => {
    await fetch('/api/interview/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ 
            sessionId, 
            timestamp: Date.now(),
            transcriptCount: currentTranscripts.length 
        })
    });
};

setInterval(sendHeartbeat, 30000);
```

#### 3.2 **Subscription Timer Edge Cases**
**Location:** `src/app/interview/[sessionId]/live/page.tsx:54-59` & `src/hooks/use-subscription-timer.ts`

```typescript
const subscriptionTimer = useSubscriptionTimer({
    userId: user?.id,
    onTimeExpired: () => handleEndSession?.(),
    warnAt: [5, 2, 1],
    isActive: isTimerActive,
});
```

**Issues:**
- ⚠️ **Client-side countdown:** Timer runs on client, can be manipulated
  - User can pause browser tab, timer stops
  - User can change system time
- ❌ **No server validation:** When session ends, server doesn't verify user had time remaining
- ⚠️ **Warning race condition:** If user has 1m30s left:
  - Warning at 2 minutes won't show
  - Warning at 1 minute will show
  - But 1m30s > minimum 2-minute requirement
- ❌ **Timer doesn't sync with actual usage:** 
  - Timer starts on agent ready (line 378-379)
  - But usage tracking started on `onConnected` (line 314-316)
  - Potential 5-10 second gap

**Recommendations:**
```typescript
// Server-side session time enforcement
// Add middleware to LiveKit room
const validateSessionTime = async (sessionId: string) => {
    const session = await getSession(sessionId);
    const user = session.user_id;
    const usage = await subscriptionService.checkUsageLimit(user);
    
    if (usage.remainingSeconds < 30) {
        // Gracefully disconnect with warning
        await room.disconnect();
        return { allowed: false, reason: 'insufficient_time' };
    }
    
    return { allowed: true };
};

// Call every minute during live session
setInterval(async () => {
    const result = await validateSessionTime(sessionId);
    if (!result.allowed) {
        toast.error("Session time expired");
        handleEndSession();
    }
}, 60000);
```

#### 3.3 **Threshold Validation**
**Location:** `src/app/interview/[sessionId]/live/page.tsx:226-250`

```typescript
const userTurns = await interviewService.getUserTurnCount(currentSessionId);
const metThreshold = totalDuration >= 120 && userTurns >= 2;

if (metThreshold) {
    await interviewService.completeSession(currentSessionId, { totalHintsUsed: hintsUsed });
    generateFeedbackInBackground(currentSessionId);
} else {
    await interviewService.completeSession(currentSessionId, {
        feedback: {
            note: "Insufficient data for report generation",
            reason: totalDuration < 120 ? "duration_too_short" : "too_few_responses"
        }
    });
}
```

**Issues:**
- ⚠️ **Hard-coded thresholds:** 120s and 2 turns not configurable
- ❌ **User turn counting logic:** 
  ```typescript
  // interview.service.ts:778
  return transcripts.filter((t: any) => t.speaker === 'user' || t.role === 'user').length;
  ```
  - Checks BOTH `speaker` and `role` fields - inconsistent schema
  - No validation that turns have actual content (could be empty strings)
- ⚠️ **Quality not checked:** User could say "yes" twice and meet threshold
- ❌ **Race condition:** Transcript count fetched separately from duration
  - New transcript could be added between checks

**Recommendations:**
```typescript
// Enhanced threshold validation
const validateInterviewQuality = async (sessionId: string) => {
    const session = await getSession(sessionId);
    const transcripts = session.transcript || [];
    
    // Minimum duration check
    if (session.duration_seconds < 120) {
        return { valid: false, reason: 'duration_too_short' };
    }
    
    // Minimum user responses
    const userResponses = transcripts.filter(t => 
        (t.speaker === 'user' || t.role === 'user') && 
        t.text?.trim().length > 10 // At least 10 characters
    );
    
    if (userResponses.length < 2) {
        return { valid: false, reason: 'insufficient_responses' };
    }
    
    // Quality check: average response length
    const avgLength = userResponses.reduce((sum, r) => 
        sum + r.text.length, 0
    ) / userResponses.length;
    
    if (avgLength < 20) {
        return { valid: false, reason: 'responses_too_short' };
    }
    
    return { valid: true };
};
```

#### 3.4 **Network Failure Handling**
**Location:** `src/app/interview/[sessionId]/live/page.tsx:301-304, 320-366`

```typescript
onError={(err) => {
    console.error("LiveKit Error:", err);
    toast.error(`Connection error: ${err.message}`);
}}

onDisconnected={async () => {
    // ... save resumption ...
    toast.warning("Connection lost. Redirecting to dashboard...");
    router.replace("/dashboard");
}}
```

**Issues:**
- ❌ **No retry mechanism:** Single disconnection immediately ends interview
  - Network blip causes full abandonment
- ❌ **No data preservation:** User loses all progress, transcript already saved but can't continue
- ⚠️ **Toast then redirect:** User might not see the warning before redirect
- ❌ **No reconnection option:** Other video platforms allow brief reconnection window

**Recommendations:**
```typescript
const [disconnectCount, setDisconnectCount] = useState(0);
const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

onDisconnected={async () => {
    if (isEndingSession.current) return;
    
    setDisconnectCount(prev => prev + 1);
    
    // Allow 3 reconnection attempts within 2 minutes
    if (disconnectCount < 3) {
        toast.info("Connection lost. Attempting to reconnect...", {
            duration: 10000,
            action: {
                label: "End Session",
                onClick: () => handleEndSession()
            }
        });
        
        // Give 30 seconds to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
            toast.error("Could not reconnect. Saving your progress...");
            handleSessionDisconnect();
        }, 30000);
        
        return; // Don't redirect yet
    } else {
        // Too many disconnects, give up
        toast.error("Multiple connection failures. Ending session...");
        await handleSessionDisconnect();
    }
}}

onConnected={async () => {
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        toast.success("Reconnected! Continuing interview...");
        setDisconnectCount(0);
    }
    // ... rest of connection logic
}}
```

---

## 4. Session Completion & Feedback

### 🔴 Critical Edge Cases

#### 4.1 **Background Feedback Generation**
**Location:** `src/context/FeedbackContext.tsx:32-76`

```typescript
const generateFeedbackInBackground = useCallback(async (sessionId: string) => {
    setIsGenerating(true);
    const success = await interviewService.generateAllResumptionFeedback(sessionId);
    
    if (success) {
        toast.success("Interview feedback is ready!", {
            action: { label: "View Report", onClick: () => window.location.href = `/interview/${sessionId}/report` }
        });
    } else {
        toast.error("Feedback generation failed. Please try again from the report page.");
    }
    setIsGenerating(false);
}, []);
```

**Issues:**
- ⚠️ **User navigated away:** Background process continues but user is on dashboard
  - Toast notification might be missed
  - State (`isGenerating`) lost on page change
- ❌ **No retry mechanism:** Single failure means user must manually retry from report page
- ❌ **No progress indication:** Long-running Gemini API call has no progress updates
  - For 10-minute interview with 50 transcript items, could take 30-60 seconds
- ⚠️ **Memory leak risk:** If user closes tab, promise continues on server but orphaned on client

**Recommendations:**
```typescript
// Use IndexedDB or localStorage for persistent state
const generateFeedbackInBackground = async (sessionId: string) => {
    // Store generation state
    localStorage.setItem(`feedback_generating_${sessionId}`, JSON.stringify({
        sessionId,
        startTime: Date.now(),
        status: 'generating'
    }));
    
    try {
        const success = await interviewService.generateAllResumptionFeedback(sessionId);
        
        if (success) {
            localStorage.setItem(`feedback_generating_${sessionId}`, JSON.stringify({
                sessionId,
                status: 'complete',
                completedAt: Date.now()
            }));
            
            // Show notification even if user navigated away
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Interview Report Ready!', {
                    body: 'Click to view your detailed feedback',
                    icon: '/favicon.ico',
                    tag: sessionId
                });
            }
        } else {
            throw new Error('Generation failed');
        }
    } catch (error) {
        localStorage.setItem(`feedback_generating_${sessionId}`, JSON.stringify({
            sessionId,
            status: 'failed',
            error: error.message,
            failedAt: Date.now()
        }));
        
        // Auto-retry once after 5 seconds
        setTimeout(() => retryGeneration(sessionId), 5000);
    }
};

// On dashboard mount, check for pending generations
useEffect(() => {
    Object.keys(localStorage)
        .filter(key => key.startsWith('feedback_generating_'))
        .forEach(key => {
            const state = JSON.parse(localStorage.getItem(key));
            if (state.status === 'complete') {
                toast.success("Your interview report is ready!", {
                    action: { label: "View", onClick: () => router.push(`/interview/${state.sessionId}/report`) }
                });
            }
        });
}, []);
```

#### 4.2 **Gemini API Rate Limits & Errors**
**Location:** `src/services/interview.service.ts:833-843`

```typescript
const { generateFeedback } = await import('@/lib/gemini-feedback');
const feedback = await generateFeedback(transcriptSlice, sessionData);
```

**Issues:**
- ❌ **No rate limit handling:** Gemini API has request limits
  - If multiple users complete interviews simultaneously, some will fail
- ❌ **No error details exposed:** Users just see "Feedback generation failed"
  - Could be: quota exceeded, invalid API key, network error, malformed request
- ⚠️ **Large transcripts:** No chunking strategy for very long interviews
  - 1-hour interview could have 200+ transcript items
  - Gemini input token limit might be exceeded
- ❌ **No retry with backoff:** Single failure = permanent failure

**Recommendations:**
```typescript
// lib/gemini-feedback.ts enhancements
import { retry } from '@/lib/retry-helper';

const generateFeedback = async (transcript: any[], session: any) => {
    try {
        // Chunk large transcripts
        const MAX_ITEMS_PER_CHUNK = 50;
        const chunks = chunkArray(transcript, MAX_ITEMS_PER_CHUNK);
        
        const feedbackChunks = await Promise.all(
            chunks.map((chunk, index) => 
                retry(
                    () => callGeminiAPI(chunk, session, index),
                    {
                        maxAttempts: 3,
                        delayMs: 1000,
                        backoffMultiplier: 2,
                        onRetry: (attempt, error) => {
                            console.log(`Retry attempt ${attempt} for chunk ${index}:`, error.message);
                        }
                    }
                )
            )
        );
        
        // Merge chunk feedbacks
        return mergeFeedbacks(feedbackChunks);
        
    } catch (error) {
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
            // Queue for retry in 1 minute
            await queueForRetry(session.id, 60000);
            throw new Error('API rate limit reached. Your report will be generated shortly.');
        } else if (error.code === 'QUOTA_EXCEEDED') {
            throw new Error('Daily API quota exceeded. Please try again tomorrow.');
        } else {
            throw new Error(`Feedback generation error: ${error.message}`);
        }
    }
};
```

---

## 5. Report Generation & Display

### 🔴 Critical Edge Cases

#### 5.1 **Polling Mechanism**
**Location:** `src/app/interview/[sessionId]/report/page.tsx:135-188`

```typescript
const pollWithRetry = async (): Promise<'SUCCESS' | 'PENDING' | 'RETRY' | 'FATAL'> => {
    const maxRetries = 30;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        const freshSession = await fetchSession(true);
        
        if (freshSession?.feedback) {
            return 'SUCCESS';
        }
        
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return 'FATAL';
};
```

**Issues:**
- ⚠️ **Fixed 2-second interval:** Polls every 2s for up to 60s (30 × 2s)
  - Wastes resources if feedback takes 45 seconds
  - Not enough time if feedback takes 70 seconds
- ❌ **No exponential backoff:** Constant polling is inefficient
- ❌ **Blocks UI:** User can't interact while polling
- ⚠️ **Memory leak:** If user navigates away during polling, promise chain continues

**Recommendations:**
```typescript
// Exponential backoff with maximum wait time
const pollWithSmartRetry = async (): Promise<'SUCCESS' | 'TIMEOUT'> => {
    const MAX_TOTAL_WAIT = 120000; // 2 minutes
    const INITIAL_DELAY = 1000;
    const MAX_DELAY = 10000;
    let delay = INITIAL_DELAY;
    let totalWait = 0;
    
    const controller = new AbortController();
    
    // Cleanup on unmount
    const cleanup = () => controller.abort();
    window.addEventListener('beforeunload', cleanup);
    
    while (totalWait < MAX_TOTAL_WAIT) {
        if (controller.signal.aborted) {
            return 'TIMEOUT';
        }
        
        const freshSession = await fetchSession(true);
        if (freshSession?.feedback) {
            window.removeEventListener('beforeunload', cleanup);
            return 'SUCCESS';
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        totalWait += delay;
        delay = Math.min(delay * 1.5, MAX_DELAY); // Exponential backoff
    }
    
    window.removeEventListener('beforeunload', cleanup);
    return 'TIMEOUT';
};

// Better: Use WebSocket or Server-Sent Events
const subscribeToFeedbackUpdates = (sessionId: string) => {
    const eventSource = new EventSource(`/api/feedback-status/${sessionId}`);
    
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'complete') {
            setFeedbackReady(true);
            eventSource.close();
        } else if (data.status === 'progress') {
            setProgress(data.percentage);
        }
    };
    
    eventSource.onerror = () => {
        eventSource.close();
        // Fallback to polling
        pollWithSmartRetry();
    };
};
```

#### 5.2 **Feedback Data Structure**
**Location:** `src/services/interview.service.ts:872-925`

```typescript
if (resumptionFeedbacks.length === 1) {
    // Single resumption - flatten structure
    updatedFeedback = { score, executiveSummary, ... };
} else {
    // Multiple resumptions - nested structure
    updatedFeedback = { overall: {...}, resumptions: [...] };
}
```

**Issues:**
- ⚠️ **Inconsistent schema:** Report page must handle TWO different structures
  - Single resumption: flat object
  - Multiple resumptions: nested object with `overall` and `resumptions`
- ❌ **Frontend complexity:** Every component must check which structure is present
- ⚠️ **Migration issues:** If old session has one structure, new logic might break

**Recommendations:**
```typescript
// Always use consistent structure
const normalizedFeedback = resumptionFeedbacks.length === 1
    ? {
        overall: resumptionFeedbacks[0],
        resumptions: [resumptionFeedbacks[0]], // Include for consistency
        multipleResumptions: false
      }
    : {
        overall: aggregatedFeedback,
        resumptions: resumptionFeedbacks,
        multipleResumptions: true
      };

await this.updateSession(sessionId, {
    feedback: normalizedFeedback,
    score: sessionScore,
    feedback_version: '2.0' // Add versioning
});

// Frontend can always access feedback.overall
const displayFeedback = session.feedback?.overall || session.feedback;
```

---

## 6. Subscription & Usage Tracking

### 🔴 Critical Edge Cases

#### 6.1 **Race Conditions in Usage Tracking**
**Location:** `src/services/subscription.service.ts:103-167`

```typescript
async trackUsage(userId: string, seconds: number): Promise<boolean> {
    const { error } = await supabase.rpc('increment_usage', {
        user_uuid: userId,
        seconds_to_add: Math.round(seconds)
    });
    
    if (error) {
        // Fallback: manual update
        const { data: subscriptions } = await supabase
            .from("subscriptions")
            .select("id, seconds_used")
            .eq("user_id", userId);
            
        const newSecondsUsed = (sub.seconds_used || 0) + seconds;
        await supabase.from("subscriptions").update({ seconds_used: newSecondsUsed });
    }
}
```

**Issues:**
- ⚠️ **RPC failure fallback has race condition:** 
  - Read `seconds_used`
  - Calculate new value
  - Write back
  - Another request can interleave and cause lost updates
- ❌ **No idempotency key:** Same duration could be charged twice if request retried
- ⚠️ **Rounding:** `Math.round(seconds)` could accumulate errors over time
- ❌ **No verification:** Server doesn't verify the duration matches actual session time

**Recommendations:**
```typescript
// Create idempotent usage tracking endpoint
// database: CREATE TABLE usage_tracking_log (
//   id UUID PRIMARY KEY,
//   user_id UUID NOT NULL,
//   session_id UUID NOT NULL,
//   segment_id VARCHAR,
//   seconds INTEGER NOT NULL,
//   idempotency_key VARCHAR UNIQUE NOT NULL,
//   created_at TIMESTAMP DEFAULT NOW()
// );

async trackUsage(userId: string, sessionId: string, seconds: number, segmentId?: string): Promise<boolean> {
    const idempotencyKey = `${sessionId}-${segmentId || 'main'}-${seconds}`;
    
    const { data, error } = await supabase.rpc('atomic_track_usage', {
        user_uuid: userId,
        session_uuid: sessionId,
        segment_id: segmentId,
        seconds_to_add: seconds,
        idempotency_key: idempotencyKey
    });
    
    if (error) {
        if (error.code === 'DUPLICATE_KEY') {
            console.log('Usage already tracked (idempotent)');
            return true;
        }
        throw error;
    }
    
    return true;
}

// Database function ensures atomicity:
CREATE OR REPLACE FUNCTION atomic_track_usage(
    user_uuid UUID,
    session_uuid UUID,
    segment_id VARCHAR,
    seconds_to_add INTEGER,
    idempotency_key VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if already processed
    IF EXISTS (SELECT 1 FROM usage_tracking_log WHERE idempotency_key = $5) THEN
        RETURN TRUE;
    END IF;
    
    -- Insert log entry (guarantees once-only via unique constraint)
    INSERT INTO usage_tracking_log (user_id, session_id, segment_id, seconds, idempotency_key)
    VALUES (user_uuid, session_uuid, segment_id, seconds_to_add, idempotency_key);
    
    -- Update subscription atomically
    UPDATE subscriptions
    SET seconds_used = seconds_used + seconds_to_add,
        updated_at = NOW()
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Update daily usage atomically
    INSERT INTO daily_usage (user_id, date, seconds, sessions)
    VALUES (user_uuid, CURRENT_DATE, seconds_to_add, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET seconds = daily_usage.seconds + seconds_to_add,
        sessions = daily_usage.sessions + 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### 6.2 **Subscription Timer Naming Bug**
**Location:** Multiple files

```typescript
// subscription.service.ts:197
return {
    hasLimit: remainingSeconds <= 0,
    remainingMinutes: Math.max(0, remainingSeconds), // ❌ Variable named "Minutes" but contains SECONDS
    percentageUsed,
};

// use-subscription-timer.ts:45
const remainingSeconds = await subscriptionService.getRemainingMinutes(userId); // ❌ Function named "Minutes"
setTotalRemainingSeconds(remainingSeconds); // ✅ Correctly treated as seconds

// start-interview/page.tsx:226
if (usage.remainingMinutes < 120) { // ❌ Comparing seconds to 120 but variable named "minutes"
```

**Issues:**
- 🐛 **Critical naming bug:** `remainingMinutes` actually contains seconds
- ❌ **Inconsistent usage:** Some parts of code treat as minutes, some as seconds
- ⚠️ **Hard to maintain:** Future developers will be confused

**Impact:** Could cause minimum balance checks to fail or allow sessions when they shouldn't

**Recommendations:**
```typescript
// Rename everywhere for clarity
return {
    hasLimit: remainingSeconds <= 0,
    remainingSeconds: Math.max(0, remainingSeconds), // ✅ Clear naming
    remainingMinutes: Math.max(0, Math.floor(remainingSeconds / 60)), // Add computed field
    percentageUsed,
};

// Update all call sites
const usage = await subscriptionService.checkUsageLimit(user.id);
if (usage.remainingSeconds < 120) { // ✅ Clear: 120 seconds = 2 minutes
    toast.error("Need at least 2 minutes to start");
}
```

---

## 7. Database & State Management

### 🔴 Critical Edge Cases

#### 7.1 **Transcript Schema Inconsistency**
**Location:** `src/services/interview.service.ts:778`

```typescript
async getUserTurnCount(sessionId: string): Promise<number> {
    const transcripts = await this.getTranscripts(sessionId);
    return transcripts.filter((t: any) => 
        t.speaker === 'user' || t.role === 'user' // ❌ Checks TWO fields
    ).length;
}
```

**Issues:**
- ❌ **Inconsistent schema:** Transcripts use either `speaker` OR `role` field
- ⚠️ **No validation:** New transcripts could use different fields
- ❌ **Type safety:** Using `any` type, no TypeScript protection

**Recommendations:**
```typescript
// Define strict transcript type
interface TranscriptEntry {
    id: string | number;
    role: 'user' | 'assistant' | 'agent'; // ✅ Standardize on 'role'
    text: string;
    timestamp: string | number;
    metadata?: {
        sentiment?: string;
        confidence?: number;
    };
}

// Migration script to standardize existing data
async migrateTranscripts() {
    const sessions = await supabase
        .from('interview_sessions')
        .select('id, transcript')
        .not('transcript', 'is', null);
    
    for (const session of sessions) {
        const transcript = session.transcript as any[];
        const normalized = transcript.map(t => ({
            ...t,
            role: t.role || (t.speaker === 'user' ? 'user' : 'assistant'),
            speaker: undefined // Remove old field
        }));
        
        await supabase
            .from('interview_sessions')
            .update({ transcript: normalized })
            .eq('id', session.id);
    }
}

// Enforce in code
async addTranscriptEntry(sessionId: string, entry: Omit<TranscriptEntry, 'id'>) {
    if (!['user', 'assistant', 'agent'].includes(entry.role)) {
        throw new Error(`Invalid role: ${entry.role}`);
    }
    // ... rest of logic
}
```

#### 7.2 **Session Status Transitions**
**Current states:** `in_progress`, `completed`, `abandoned`

**Issues:**
- ❌ **No state machine:** Any state can transition to any other state
- ⚠️ **No failed state:** What if session crashes mid-interview?
- ❌ **No paused state:** Disconnected sessions are abandoned, can't resume
- ⚠️ **No audit trail:** Can't see state history

**Recommendations:**
```typescript
// Define state machine
type SessionStatus = 
    | 'created'       // Initial state after creation
    | 'setup'         // User is on setup page
    | 'live'          // Interview in progress  
    | 'paused'        // Temporarily disconnected (can resume)
    | 'completing'    // Ending process started
    | 'completed'     // Successfully finished
    | 'abandoned'     // User started new session
    | 'failed'        // Error occurred
    | 'expired';      // Timed out

const SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
    created: ['setup', 'abandoned'],
    setup: ['live', 'abandoned'],
    live: ['paused', 'completing', 'failed'],
    paused: ['live', 'abandoned', 'expired'],
    completing: ['completed', 'failed'],
    completed: [],
    abandoned: [],
    failed: [],
    expired: []
};

async transitionSessionStatus(
    sessionId: string, 
    newStatus: SessionStatus, 
    reason?: string
): Promise<boolean> {
    const session = await this.getSessionById(sessionId);
    const currentStatus = session.status as SessionStatus;
    
    const allowedTransitions = SESSION_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
            `Invalid transition: ${currentStatus} -> ${newStatus}`
        );
    }
    
    // Log state change
    await supabase.from('session_status_history').insert({
        session_id: sessionId,
        from_status: currentStatus,
        to_status: newStatus,
        reason,
        changed_at: new Date().toISOString()
    });
    
    await this.updateSession(sessionId, { status: newStatus });
    return true;
}
```

---

## Critical Edge Cases Matrix

### 🔥 **HIGH PRIORITY** (Fix Immediately)

| # | Issue | Location | Impact | Affected Users |
|---|-------|----------|--------|----------------|
| 1 | Duration triple-tracking | live/page.tsx:144-260 | Duplicate charges | All users |
| 2 | `remainingMinutes` naming bug | subscription.service.ts:197 | Wrong minimum checks | All users |
| 3 | Race condition in session creation | start-interview/page.tsx:238 | Duplicate sessions | Users with multiple tabs |
| 4 | PDF/DOCX parsing not implemented | start-interview/page.tsx:178 | Fake job descriptions | Users uploading files |
| 5 | No separate mic-only permission | setup/page.tsx:157 | Can't do audio-only | Users without camera |
| 6 | Fire-and-forget cleanup save | live/page.tsx:156 | Lost duration data | Users closing tab |
| 7 | Usage tracking race condition | subscription.service.ts:121 | Lost usage data | Concurrent sessions |

### ⚠️ **MEDIUM PRIORITY** (Fix Soon)

| # | Issue | Location | Impact | Affected Users |
|---|-------|----------|--------|----------------|
| 8 | No reconnection window | live/page.tsx:320 | Lost interviews | Users with unstable network |
| 9 | Polling inefficiency | report/page.tsx:135 | Wasted resources | All users viewing reports |
| 10 | Token TTL not validated | setup/page.tsx:278 | Slow connection | Users waiting on setup |
| 11 | No idempotency in tracking | subscription.service.ts:111 | Duplicate charges | Retry scenarios |
| 12 | Transcript schema inconsistency | interview.service.ts:778 | Incorrect turn counts | Random failures |
| 13 | Client-side timer only | live/page.tsx:55 | Time manipulation | Malicious users |
| 14 | No session ownership check | setup/page.tsx:115 | Unauthorized access | Users knowing session IDs |

### 📝 **LOW PRIORITY** (Nice to Have)

| # | Issue | Location | Impact | Affected Users |
|---|-------|----------|--------|----------------|
| 15 | Feedback structure inconsistency | interview.service.ts:874 | Complex frontend logic | Developers |
| 16 | Hard-coded thresholds | live/page.tsx:228 | Inflexible quality checks | Edge case users |
| 17 | No state machine for status | interview.service.ts | No audit trail | Support team |
| 18 | Skills not sanitized | start-interview/page.tsx:206 | Potential injection | Users entering special chars |
| 19 | No progress on feedback generation | FeedbackContext.tsx:38 | Poor UX | Users with long interviews |
| 20 | Case-sensitive skill duplicates | start-interview/page.tsx:208 | Duplicate skills | Users mixing case |

---

## Priority Recommendations

### 🚨 **Immediate Actions** (This Week)

1. **Fix duration tracking** → Add idempotency keys and atomic updates
2. **Rename remainingMinutes** → Clear variable naming everywhere
3. **Implement proper mic/camera separation** → Allow audio-only interviews
4. **Add session ownership verification** → Security check on all session pages
5. **Fix PDF/DOCX parsing** → Implement server-side parsing or remove feature

### 📅 **Short Term** (Next Sprint)

6. **Add reconnection window** → 30-second grace period for disconnections
7. **Implement exponential backoff polling** → Reduce server load
8. **Add usage tracking idempotency** → Prevent duplicate charges
9. **Create session state machine** → Proper state transitions
10. **Add WebSocket for feedback status** → Replace polling

### 🎯 **Long Term** (Next Quarter)

11. **Server-side time enforcement** → Don't trust client timer
12. **Comprehensive error categorization** → Better user error messages
13. **Add interview resume capability** → Don't lose progress on disconnect
14. **Implement progressive feedback** → Show partial results while generating
15. **Add monitoring and alerting** → Track all edge case occurrences

---

## Testing Checklist

### Unit Tests Needed
- [ ] Subscription usage tracking with concurrent requests
- [ ] Session status transitions validation
- [ ] Transcript turn counting with different schemas
- [ ] Duration calculation with clock skew

### Integration Tests Needed
- [ ] Complete interview flow (start → setup → live → complete → report)
- [ ] Session abandon and restart flow
- [ ] Network disconnection and reconnection
- [ ] Multiple resumptions in single interview

### Edge Case Tests Needed
- [ ] Start two interviews simultaneously in different tabs
- [ ] Close browser during live interview
- [ ] Change system time during interview
- [ ] Exceed subscription limit mid-interview
- [ ] Upload corrupted files
- [ ] Deny camera but allow mic permissions
- [ ] Token expiry during setup
- [ ] Feedback generation timeout
- [ ] API rate limit errors

---

## Monitoring Recommendations

### Metrics to Track
```typescript
// Add to monitoring dashboard
const metricsToTrack = {
    // Session metrics
    'sessions.created': counter,
    'sessions.completed': counter,
    'sessions.abandoned': counter,
    'sessions.failed': counter,
    
    // Duration metrics
    'duration.tracking.errors': counter,
    'duration.tracking.duplicates': counter,
    'duration.average': histogram,
    
    // Feedback metrics
    'feedback.generation.started': counter,
    'feedback.generation.completed': counter,
    'feedback.generation.failed': counter,
    'feedback.generation.duration_ms': histogram,
    
    // LiveKit metrics
    'livekit.connection.failed': counter,
    'livekit.disconnections': counter,
    'livekit.reconnections': counter,
    
    // Subscription metrics
    'subscription.tracking.errors': counter,
    'subscription.usage.duplicate': counter,
    'subscription.limit.reached': counter
};
```

### Alerts to Configure
- Session completion rate < 80%
- Feedback generation failure rate > 5%
- Duration tracking duplicates > 0
- LiveKit disconnection rate > 10%
- Usage tracking errors > 0

---

## Database Schema Updates Needed

```sql
-- Add session status history table
CREATE TABLE session_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id),
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

-- Add usage tracking log for idempotency
CREATE TABLE usage_tracking_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    session_id UUID NOT NULL REFERENCES interview_sessions(id),
    segment_id VARCHAR(100),
    seconds INTEGER NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add unique constraint for active sessions
ALTER TABLE interview_sessions 
ADD CONSTRAINT unique_active_session 
UNIQUE (user_id, position, interview_type, status) 
WHERE status = 'in_progress';

-- Add indexes
CREATE INDEX idx_status_history_session ON session_status_history(session_id, changed_at DESC);
CREATE INDEX idx_usage_tracking_session ON usage_tracking_log(session_id);
CREATE INDEX idx_usage_tracking_idempotency ON usage_tracking_log(idempotency_key);
```

---

## Conclusion

Your interview application has a solid foundation, but there are **critical edge cases** that need immediate attention,
particularly around:

1. **Duration tracking and usage billing** (triple tracking, race conditions)
2. **Session concurrency** (multiple tabs, ownership verification)
3. **Network reliability** (disconnections, reconnections)
4. **Data consistency** (naming bugs, schema inconsistencies)

The good news is that most issues have clear solutions and can be addressed incrementally without major rewrites.

**Next Steps:**
1. Review HIGH PRIORITY issues with your team
2. Create tickets for each critical issue
3. Implement monitoring for edge cases
4. Add comprehensive tests
5. Deploy fixes in phases with feature flags

