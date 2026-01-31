"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, gender?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, gender?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            gender: gender,
          },
        },
      });

      if (error) throw error;

      if (data?.user?.identities?.length === 0) {
        toast.error("An account with this email already exists");
        return;
      }

      toast.success(
        "Account created successfully! Please check your email to verify.",
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to create account");
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to sign in");
      throw err;
    }
  };

  const signOut = async () => {
    try {
      // 1. Clear session and local state
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2. Clear stores to prevent stale data flash
      // We import these dynamically to avoid circular dependencies if any
      const { useCacheStore } = await import("@/stores/use-cache-store");
      const { useInterviewStore } = await import("@/stores/use-interview-store");

      useCacheStore.getState().invalidateAllCache();
      useInterviewStore.getState().clearSession();

      setUser(null);
      setSession(null);

      toast.success("Signed out successfully");
      router.push("/");
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use configured site URL for production, or current origin for local dev
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to sign in with Google");
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Please check your inbox.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to send reset email");
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to update password");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, signInWithGoogle, resetPassword, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
