# API Documentation
## AI Interviewer Platform

### 1. Overview
The platform primarily interacts with its backend via Next.js Server Actions and Supabase Client methods. However, specific API endpoints exist for specialized non-CRUD operations.

**Base URL**: `/api`

### 2. Authentication
Most endpoints function within a Next.js session context. Ensure requests include the session cookies managed by the application.

### 3. Endpoints

#### 3.1 Generate LiveKit Token
**POST** `/livekit_token`

Generates a secure access token for a user to join a specific interview room.

- **Request Body**:
  ```json
  {
    "room": "room_uuid_string",
    "username": "user_display_name"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
  ```
- **Response (400/500)**:
  ```json
  {
    "error": "Error description message"
  }
  ```

#### 3.2 Fix Stuck Sessions
**POST** `/fix-stuck-sessions`

Maintenance endpoint to reset sessions that may have been orphaned due to server restarts or crashes.

- **Request Body**: Empty (Uses admin context internally)
- **Response**:
  ```json
  {
    "fixed": 5, // Number of sessions reset
    "message": "Cleanup successful"
  }
  ```

### 4. Supabase RPC Functions
These database functions are called via the Supabase Client SDK (`supabase.rpc(...)`).

#### `increment_usage`
Increments usage counters for the user within a transaction.
- **Params**:
    - `user_id_param` (UUID)
    - `minutes_param` (Integer)

#### `check_and_reset_monthly_usage`
Checks if the user's billing cycle has rolled over and resets counters if necessary.
- **Params**: None (Uses internal logic based on `subscriptions` table)
