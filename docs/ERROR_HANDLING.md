# Error Handling & Edge Cases
## AI Interviewer Platform

### 1. Critical Failure Scenarios
#### 1.1 Network Disconnection
- **Scenario**: User's internet drops during a live interview.
- **System Behavior**: LiveKit room connection state changes to `disconnected`.
- **Handling**:
    - UI shows a "Reconnecting..." toast.
    - Application attempts auto-reconnect for 30 seconds.
    - If failed, session status remains `in_progress` in DB. User can resume from Dashboard via "Resume" button.

#### 1.2 AI Service Unavailability
- **Scenario**: Google Gemini API is down or rate-limited (429/500 errors).
- **Handling**:
    - **Immediate**: Fallback to a generic "Please hold on a moment" audio message if possible, or silence.
    - **Persistent**: If API fails 3x consecutively, gracefully end session and inform user "AI Service currently unavailable". Save partial transcript.

#### 1.3 Microphone Permission Denied
- **Scenario**: User blocks mic access in browser.
- **Handling**:
    - `StartInterview` page checks permissions before room conceptualization.
    - Displays a visual guide (Overlay) showing how to re-enable permissions in Chrome/Firefox/Safari.
    - Blocks entry to the interview room until permission is granted.

### 2. API Error Responses
Standardized error formats for frontend consumption.
```json
{
  "error": "ERR_CODE_string",
  "message": "Human readable description",
  "details": { ...optional_context }
}
```

### 3. Edge Cases & Validations
| Feature | Edge Case | Mitigation / Validation |
| :--- | :--- | :--- |
| **Auth** | User account deleted while logged in | Session validation middleware redirects to login |
| **Form** | Domain description > 5000 chars | Client-side Zod validation + Server truncation |
| **Audio** | No audio detected for 60s | UI prompts "Are you still there?" to save costs |
| **Quotas** | Usage limit exceeded mid-interview | Allow completion of current session (graceful), block next one |
| **Browser** | Unsupported browser (e.g., IE) | Feature detection for WebRTC; Show "Update Browser" screen |

### 4. Debugging Guide
- **Connection Issues**: Check Browser Console for `LiveKit` WebSocket errors.
- **AI Silence**: Check Server Logs for `Gemini API` response codes.
- **Missing Transcripts**: Verify `interview.service` saved the final JSON payload to Supabase.
