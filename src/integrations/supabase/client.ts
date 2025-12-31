// Supabase client for Next.js
// Configure your Supabase credentials in .env.local
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase URL and Key from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate environment variables immediately
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  if (typeof window === 'undefined') {
    console.error("❌ SUPABASE CONFIG ERROR: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing!");
  }
}

// Create a public client for anonymous requests (more stable on server)
export const publicSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      // Increase fetch timeout for slower networks
      fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) })
    }
  }
);

// Create a Supabase client for browser use with cookie-based storage
export const supabase = createBrowserClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);