# Features List
## AI Interviewer Platform

This document tracks all features of the application, ranging from core capabilities ("Big Features") to granular UI/UX details ("Small Features").

### 🚀 Major Features (Core Capabilities)

#### 1. AI-Powered Voice Interviews
- **Real-time Voice Conversation**: Low-latency voice interaction with Google Gemini via LiveKit.
- **Dynamic Questioning**: The AI adapts follow-up questions based on candidate answers.
- **Multiple Interview Modes**:
    - **General**: Pick a domain (e.g., Frontend) and difficulty.
    - **Company-Specific**: Practice with curated templates (e.g., Google, Amazon) and roles.
- **Resume Capability**: If a network drop occurs, users can reload the page or "Resume" from the dashboard to continue exactly where they left off.

#### 2. Real-Time Sentiment Analysis
- **Live Confidence Tracking**: Monitors candidate's emotional state and confidence levels during the interview using Azure AI Text Analytics.
- **Confidence Score Calculation**: 
    - **Formula**: `(Positive × 100) + (Neutral × 40) - (Negative × 60)`, clamped to 0-100 range.
    - **Real-time Updates**: Scores update as the candidate speaks, providing instant feedback on delivery confidence.
- **User Control**: 
    - **Opt-in Feature**: Users can enable/disable sentiment analysis in their settings.
    - **Privacy First**: Sentiment data is processed in real-time and not stored permanently.
- **Visual Feedback**: Live confidence meter displayed during the interview session with color-coded indicators (green for confident, yellow for neutral, red for low confidence).

#### 3. Elite Answer Detection
- **AI-Powered Answer Quality Assessment**: Automatically identifies exceptional answers during the interview.
- **Elite Badge System**: 
    - **Recognition**: Outstanding answers are marked with a special "Elite" badge in the transcript.
    - **Criteria**: Answers are evaluated based on technical accuracy, clarity, depth, and relevance.
- **Report Integration**: Elite answers are highlighted in the post-interview report with detailed analysis of what made them exceptional.
- **Learning Tool**: Helps candidates understand what constitutes a high-quality response by showcasing their best moments.

#### 4. Hint System (Lifeline)
- **On-Demand Assistance**: Candidates can request hints during challenging questions without penalty.
- **Smart Hint Generation**: 
    - **Contextual Clues**: AI generates subtle hints based on the current question and conversation context.
    - **Non-Revealing**: Hints guide thinking without giving away the answer directly.
- **Usage Tracking**: 
    - **Limited Uses**: Each interview session has a limited number of hints available.
    - **Visual Counter**: Remaining hints displayed in the live interview interface.
- **Report Transparency**: Hint usage is noted in the final report to provide honest feedback on areas needing improvement.

#### 5. Smart Session Management
- **Pending Interview Detection**:
    - *Logic*: Prevents starting a duplicate session if one is already `in_progress` for the same domain/role.
    - *User Choice*: Popup asks to "Resume Previous" or "Abandon & Start New".
- **Abandonment Handling**: Safely marks old sessions as abandoned if the user chooses to start fresh.
- **Auto-Completion**: Sessions without transcripts are automatically closed after a timeout to prevent cost leakage.
- **Stuck Session Fixer**: "Fix Stuck Sessions" utility in settings/admin panel to clean up zombie states.

#### 6. Analytics & Feedback Engine
- **Instant Reports**: Detailed feedback generated immediately after session completion.
- **Report Thresholds**:
    - **Minimum Requirements**: AI reports are only generated if a session lasts at least **2 minutes** AND contains at least **2 user turns**.
    - **Insufficient Data Handling**: Sessions below the threshold are marked as "Insufficient Data" on the dashboard. The report page displays a helpful guide instead of an empty report.
- **Scoring System**: Quantitative scores (0-100) for Technical Accuracy, Communication, and Problem Solving.
- **Progress Tracking**:
    - **Streak Counter**: Tracks consecutive days of practice.
    - **Leaderboard**: Global ranking based on weighted scores (considering experience/number of interviews).
- **History View**: detailed list of all past interviews with quick access to reports.

#### 7. Subscription & Quota System
- **Usage Tracking**: Tracks "seconds used" per user (visible on dashboard).
- **Plan Limits**: Visual progress bar showing monthly minutes consumed vs. limit.
- **Interview Entry Guard**:
    - **Minimum Balance**: Users must have at least **2 minutes (120 seconds)** of remaining time to start any interview (General, Template, or Resume).
    - **Real-time Blocking**: If balance is too low, entry is blocked with a toast notification containing an "Upgrade" call-to-action.

#### 8. Personalized Learning Roadmap
- **AI-Generated Roadmap**: Creates customized learning paths based on interview history and performance.
- **Eligibility Check**: Requires minimum 3 completed interviews with feedback.
- **Payment Integration**: Free for first roadmap, ₹99 for subsequent generations.
- **Structured Learning Path**:
    - **Phases**: Multi-phase progression (Foundation → Advanced → Mastery).
    - **Milestones**: Specific goals with practice interviews and resources.
    - **Progress Tracking**: Visual indicators for completed items.
- **Smart Recommendations**: Analyzes weak areas, strong areas, and performance trends to suggest targeted improvements.
- **Payment Status Handling**: Pending payment modal with Razorpay integration for seamless checkout.

#### 9. Public Verification Profiles
- **Shareable Professional Dashboards**: Candidates can set their profiles to public (`/p/[id]`) to showcase their skills to recruiters or peers.
- **Verified Achievements**: Displays platform-verified stats including World Rank, Precision (Avg. Score), and Experience level.
- **Performance Visualization**: Interactive Area Charts (via Recharts) showing interview score trends over time.
- **Live Verification Ledger**: A public log of recent interviews with "Verified" badges to prove authenticity.
- **Custom Branding**: Professional dashboard-style layout with premium glassmorphic UI, high-end animations, and platform branding.
- **Lead Generation/Conversion**:
    - **"Claim Profile" CTA**: Encourages visitors to join the platform.
    - **Consistency Tracking**: Showcases the candidate's streak to prove dedication.

### ✨ Small / UI Features (Delight Details)

#### Dashboard & Navigation
- **Collapsible Sidebar**: Sidebar can be collapsed (`<` button) to give more screen real estate, state persisted in `localStorage`.
- **Mobile Menu**: Responsive hamburger menu for small screens.
- **Active State Highlighting**: Current nav item glows blue/white.
- **Streak Flame**: Animated flame icon showing current streak count.
- **Subscription Display**:
    - **Flash Prevention**: Initial subscription state uses a safe default to prevent the "0 min" warning banner from flickering on page load.
    - **Loading States**: Remaining time displays a pulse/shimmer animation while fresh data is being fetched from the server.
- **Low Time Warning Banner**: Appears when remaining time is below 5 minutes, showing "Critical" status if below 2 minutes.

#### Interview Setup (`/start-interview`)
- **Skill Tags**:
    - Users can type skills and press Enter to add them as "chips".
    - Click "x" on a chip to remove it.
- **Job Description Import**:
    - **One-click Toggle**: Switch between "Upload File" (UI Mockup) and "Manual Entry".
    - **Drag & Drop Zone**: Visual area for file uploads.
- **Dynamic Forms**:
    - "Company" dropdown only appears if "Company Mode" is selected.
    - **Pre-fill**: Selecting a company template auto-fills the default Role and Difficulty.

#### Live Interview Interface (`/live`)
- **Visualizer**: Audio visualization bars that react to user/AI voice.
- **Microphone Check**: Pre-flight check ensures audio permissions before connecting.
- **Timer**: Real-time duration display.
- **"End Interview" Confirmation**: Prevents accidental exits.
- **Toast Notifications**:
    - "Redirecting to previous interview..."
    - "Connection established"
    - "Microphone access denied" (with guide).

#### Feedback Report (`/report`)
- **Score Cards**: Color-coded cards for each metric (Green = Good, Yellow = Avg).
- **Loading State**: "Generating Report..." spinner if feedback is being created in the background.

#### Technical / Under-the-Hood
- **Optimized Queries**: Uses `useOptimizedQueries` hook for caching templates and minimizing DB hits.
- **Zustand Store**: Client-side session state for instant UI updates without prop drilling.
- **Parallel Fetching**: Fetches LiveKit token + Mic permissions in parallel for faster join times (~30% faster).
