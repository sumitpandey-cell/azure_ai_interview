# Password Reset Link Showing "Invalid or Expired" - SOLUTION

## Problem
Every password reset link from email shows "Invalid or Expired Link" error.

## Root Cause
The issue occurs because:
1. Supabase sends the recovery token in the URL hash (#)
2. The reset password page needs to exchange this token for a valid session
3. The redirect URL must be properly configured in Supabase

## ✅ SOLUTION - Follow These Steps:

### Step 1: Configure Redirect URLs in Supabase

1. **Go to Supabase Dashboard:**
   ```
   https://app.supabase.com/project/rsthmfbifjvaciaereem/settings/auth
   ```

2. **Scroll to "Redirect URLs" section**

3. **Add these URLs** (click "Add URL" for each):
   ```
   http://localhost:3000/auth/reset-password
   http://localhost:3000/**
   ```
   
   For production, also add:
   ```
   https://yourdomain.com/auth/reset-password
   https://yourdomain.com/**
   ```

4. **Click "Save"**

### Step 2: Verify Email Template

1. **Go to Email Templates:**
   ```
   https://app.supabase.com/project/rsthmfbifjvaciaereem/auth/templates
   ```

2. **Click on "Reset password" template**

3. **Verify the template contains:**
   ```html
   <a href="{{ .SiteURL }}/auth/reset-password">Reset Password</a>
   ```
   
   Or in the link:
   ```
   {{ .SiteURL }}/auth/reset-password
   ```

4. **Click "Save"**

### Step 3: Verify Site URL

1. **Go to Auth Settings:**
   ```
   https://app.supabase.com/project/rsthmfbifjvaciaereem/settings/auth
   ```

2. **Check "Site URL" is set to:**
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

3. **Click "Save"**

### Step 4: Test the Flow

1. **Clear your browser cache and cookies** (important!)

2. **Go to:** http://localhost:3000/auth

3. **Click "Forgot Password?"**

4. **Enter your email and click "Send Reset Link"**

5. **Check your email** (including spam folder)

6. **Click the reset link in the email**

7. **You should now see the "Set New Password" form** (not the error)

## 🔍 Debugging

If it still doesn't work, check the browser console:

1. **Open the reset password page**
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for these messages:**
   - ✅ "Valid session found" - Good!
   - 🔄 "Exchanging recovery token for session..." - Good!
   - ✅ "Session created successfully" - Good!
   - ❌ "Error setting session" - Problem! Check the error details
   - ❌ "No valid token or session" - The link might be expired or invalid

## 📧 Email Template Example

Your Supabase "Reset password" email template should look like this:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

## ⏰ Token Expiry

Password reset tokens expire after:
- **1 hour** by default in Supabase

If the link is older than 1 hour, request a new one.

## 🚨 Common Mistakes

❌ **Wrong redirect URL format:**
- Bad: `http://localhost:3000/reset-password`
- Good: `http://localhost:3000/auth/reset-password`

❌ **Redirect URL not added to allowed list**
- Must add exact URL to "Redirect URLs" in Supabase settings

❌ **Using the link multiple times**
- Each reset link can only be used once
- Request a new link if needed

❌ **Browser cache issues**
- Clear cookies and cache before testing

## ✅ Success Indicators

You'll know it's working when:
1. Email arrives with reset link
2. Clicking link shows "Set New Password" form (not error)
3. Console shows "✅ Session created successfully"
4. You can set a new password
5. After reset, you're redirected to sign in

## 🆘 Still Not Working?

If you've followed all steps and it still doesn't work:

1. **Check Supabase logs:**
   ```
   https://app.supabase.com/project/rsthmfbifjvaciaereem/logs/edge-logs
   ```

2. **Verify SMTP is configured** (from previous guide)

3. **Try in incognito/private browsing mode**

4. **Check if the email link URL matches your redirect URL exactly**

5. **Share the console error messages** for further debugging
