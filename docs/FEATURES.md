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

#### 2. Smart Session Management
- **Pending Interview Detection**:
    - *Logic*: Prevents starting a duplicate session if one is already `in_progress` for the same domain/role.
    - *User Choice*: Popup asks to "Resume Previous" or "Abandon & Start New".
- **Abandonment Handling**: Safely marks old sessions as abandoned if the user chooses to start fresh.
- **Auto-Completion**: Sessions without transcripts are automatically closed after a timeout to prevent cost leakage.
- **Stuck Session Fixer**: "Fix Stuck Sessions" utility in settings/admin panel to clean up zombie states.

#### 3. Analytics & Feedback Engine
- **Instant Reports**: Detailed feedback generated immediately after session completion.
- **Scoring System**: Quantitative scores (0-100) for Technical Accuracy, Communication, and Problem Solving.
- **Progress Tracking**:
    - **Streak Counter**: Tracks consecutive days of practice.
    - **Leaderboard**: Global ranking based on weighted scores (considering experience/number of interviews).
- **History View**: detailed list of all past interviews with quick access to reports.

#### 4. Subscription & Quota System
- **Usage Tracking**: Tracks "seconds used" per user (visible on dashboard).
- **Plan Limits**: Visual progress bar showing monthly minutes consumed vs. limit.

### ✨ Small / UI Features (Delight Details)

#### Dashboard & Navigation
- **Collapsible Sidebar**: Sidebar can be collapsed (`<` button) to give more screen real estate, state persisted in `localStorage`.
- **Mobile Menu**: Responsive hamburger menu for small screens.
- **Active State Highlighting**: Current nav item glows blue/white.
- **Streak Flame**: Animated flame icon showing current streak count.

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
