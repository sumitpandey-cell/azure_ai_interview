# Software Requirement Specification (SRS)
## AI Interviewer Platform

### 1. Introduction
The **AI Interviewer Platform** is a Next.js-based web application designed to conduct realistic, voice-based technical interviews using AI. It provides candidates with real-time feedback, performance scores, and personalized improvement plans.

### 2. Functional Requirements
#### 2.1 User Authentication
- **Registration/Login**: Users can sign up and log in using Email/Password or Google OAuth (via Supabase Auth).
- **Profile Management**: Users can manage their profile details (name, avatar) and view their subscription status.

#### 2.2 Dashboard
- **Overview**: Displays recent activity, streak count, and quick access to start new interviews.
- **Analytics**: Visualizes performance metrics (scores over time) and skill breakdowns.

#### 2.3 Interview Process
- **Template Selection**: Users can choose interview templates based on role (e.g., Frontend, Backend), difficulty, and focus area.
- **Microphone Check**: Pre-interview check to ensure audio input is functioning.
- **Live Interview**:
    - Real-time voice interaction with an AI interviewer (Google Gemini).
    - Transcription of both user and AI speech.
    - Ability to end the interview at any time.
- **Resumption**: Ability to resume interrupted sessions (if applicable), subject to the same subscription requirements as new interviews.
- **Entry Guards**:
    - Users must have a minimum of **2 minutes (120 seconds)** of subscription time to initiate or resume an interview.
    - Real-time balance verification must occur before session creation or redirection.

#### 2.4 Feedback & Reporting
- **Instant Report**: Detailed report generated immediately after the interview.
- **Scoring**: Quantitative scores on technical accuracy, communication clarity, and other metrics.
- **Qualitative Feedback**: Specific strengths, weaknesses, and actionable tips for improvement.
- **Data Integrity Thresholds**:
    - Reports are only generated for sessions with a minimum duration of **2 minutes** AND at least **2 user turns**.
    - Insufficient data cases must be clearly communicated to the user without triggering error states.

#### 2.5 Gamification
- **Leaderboards**: Global ranking of users based on interview performance.
- **Badges**: Achievements unlocked by completing milestones (e.g., "7-Day Streak").

#### 2.6 Public Profiles
- **Visibility Control**: Users can toggle their profile visibility to allow public access via a unique URL.
- **Credential Verification**: Shareable dashboards that provide proof of technical performance scores and platform ranking.
- **Public Ledger**: Displays a history of verified interview sessions without exposing private transcript data.

### 3. Non-Functional Requirements
#### 3.1 Performance & Latency
- **Voice Latency**: The system aims for sub-500ms latency for AI voice responses to maintain a natural conversation flow.
- **Page Load**: Dashboard and core pages should load within 1.5 seconds on standard 4G networks.

#### 3.2 Scalability
- **Database**: Supabase (PostgreSQL) is used to handle scaling user data and interview logs.
- **Stateless AI**: The AI orchestration is stateless per request, allowing horizontal scaling of the application servers.

#### 3.3 Security
- **Data Protection**: All database access is governed by Row Level Security (RLS) policies.
- **Authentication**: Secure session management via Supabase Auth.
- **API Keys**: Sensitive keys (Gemini, Supabase Admin) are stored in server-side environment variables.

#### 3.4 Reliability
- **Error Recovery**: The system handles temporary network drops during interviews with auto-reconnection attempts.
- **Availability**: Targeted 99.9% uptime for the application interface.
