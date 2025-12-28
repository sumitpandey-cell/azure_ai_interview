# Data Flow Diagram
## AI Interviewer Platform

### 1. User Interview Loop
This describes the high-level data movement during a live interview session.

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant LiveKit as LiveKit Server
    participant App as Next.js Server
    participant AI as Gemini AI
    participant DB as Supabase DB

    User->>Browser: Speaks into Microphone
    Browser->>LiveKit: Stream Audio (WebRTC)
    LiveKit->>App: Forward Audio Track / Events
    App->>AI: Send Audio/Text Prompts
    AI->>App: Stream generated text/audio response
    App->>LiveKit: Stream AI Audio Response
    LiveKit->>Browser: Play Audio Response
    Browser->>User: Hears AI Voice

    Note right of App: Asynchronously
    App->>DB: Save Transcript Segment (User & AI)
    App->>DB: Update Session Status
```

### 2. Data Persistence Flow
How data moves from temporary session state to permanent storage.

- **Input**: User fills "Start Interview" form.
- **Process**:
    1. **Initialization**: Server creates a row in `interview_sessions` with status `in_progress`.
    2. **Live Session**: Transcripts are buffered in memory/Redux and periodically pushed to `interview_sessions.transcript` JSONB column.
    3. **Completion**: When user clicks "End Interview":
        - Final transcript is flushed to DB.
        - `interview.service` triggers generation of Feedback.
        - Generates "Report" JSON with scores.
- **Output**: `interview_sessions` row status updated to `completed`.

### 3. Feedback Generation Flow
- **Trigger**: Session Completion.
- **Input**: Full Transcript + Interview Configuration (Role, Difficulty).
- **Process**:
    - System constructs a large prompt with the entire conversation context.
    - Sends prompt to Gemini Pro (Optimized for reasoning).
    - Receives JSON-structured analysis (Strengths, Weaknesses, Score).
- **Storage**: JSON response saved to `interview_sessions.feedback`.
