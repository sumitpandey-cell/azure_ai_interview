"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    User,
    Building2,
    Shield,
    Bell,
    Save,
    Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Organization = Tables<"organizations">;

export default function RecruiterSettings() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const [profileFields, setProfileFields] = useState({
        full_name: "",
        role: "Recruitment Lead"
    });
    const [orgFields, setOrgFields] = useState({
        name: "",
        website_url: "",
        region: "Global / Remote"
    });
    const [passwords, setPasswords] = useState({ current: "", new: "" });
    const [preferences, setPreferences] = useState({
        autoFinalize: true,
        publicPage: false,
        emailAlerts: true
    });

    const fetchSettings = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);
                setProfileFields({
                    full_name: profileData.full_name || "",
                    role: (user?.user_metadata?.role as string) || "Recruitment Lead"
                });

                if (profileData.org_id) {
                    const { data: orgData } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('id', profileData.org_id)
                        .single();

                    if (orgData) {
                        setOrg(orgData as unknown as Organization);
                        const orgMeta = (orgData.metadata || {}) as Record<string, unknown>;
                        setOrgFields({
                            name: orgData.name || "",
                            website_url: orgData.website_url || "",
                            region: (orgMeta?.region as string) || "Global / Remote"
                        });

                        if (orgMeta?.preferences) {
                            setPreferences({
                                ...preferences,
                                ...(orgMeta.preferences as Record<string, unknown>)
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.user_metadata?.role, preferences]);

    useEffect(() => {
        if (user) fetchSettings();
    }, [user, fetchSettings]);

    const handleSave = async () => {
        if (!user?.id) {
            toast.error("User session not found");
            return;
        }
        setSubmitting(true);
        try {
            // 1. Update Auth Metadata (Full Name & role)
            // This ensures AuthContext and parts of UI using user_metadata stay synced
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: profileFields.full_name,
                    role: profileFields.role
                }
            });
            if (authError) {
                console.error("Auth update error:", authError);
                // Continue anyway as profile table is more critical
            }

            // 2. Update Profiles Table
            const { data: pData, error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: profileFields.full_name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select();

            if (profileError) throw profileError;

            if (!pData || pData.length === 0) {
                throw new Error("Profile not found or access denied");
            }

            // 3. Update Organization
            // Need to get the org_id from the latest profile data
            const currentOrgId = pData[0].org_id || profile?.org_id;

            if (currentOrgId) {
                const { data: oData, error: orgError } = await supabase
                    .from('organizations')
                    .update({
                        name: orgFields.name,
                        website_url: orgFields.website_url,
                        metadata: {
                            ...(org?.metadata as Record<string, unknown> || {}),
                            region: orgFields.region,
                            preferences: preferences // Save user preferences here
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentOrgId)
                    .select();

                if (orgError) {
                    console.error("Organization update error:", orgError);
                    toast.error(`Organization update failed: ${orgError.message}`);
                    // Don't throw if profile succeeded, just warn
                } else if (!oData || oData.length === 0) {
                    toast.error("Could not update organization. You might not have permission.");
                }
            }

            toast.success("Settings updated successfully!");
            await fetchSettings(); // Refresh data from source
        } catch (error: unknown) {
            const err = error as Error;
            console.error("Critical error saving settings:", error);
            toast.error(err.message || "Failed to update settings");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="max-w-5xl space-y-8 animate-pulse">
            <div className="space-y-3">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-4 w-96 rounded-lg" />
            </div>

            <div className="flex gap-2 p-1.5 glass-panel rounded-2xl w-fit">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-32 rounded-xl" />
                ))}
            </div>

            <div className="glass-card rounded-[32px] p-8 space-y-8">
                <div className="flex items-center gap-6">
                    <Skeleton className="w-24 h-24 rounded-[32px]" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32 rounded-lg" />
                        <Skeleton className="h-4 w-64 rounded-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-20 rounded" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'profile', icon: User, label: 'Personal Profile' },
        { id: 'org', icon: Building2, label: 'Organization' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
    ];

    return (
        <div className="max-w-5xl space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1 font-medium">Manage your recruiter profile and organization preferences.</p>
            </div>

            <div className="space-y-8 relative z-10">
                <div className="flex flex-wrap gap-2 p-1.5 glass-panel rounded-2xl w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-black text-xs uppercase tracking-tight ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-8 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-[32px] p-8 space-y-8"
                        >
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors border border-primary/20">
                                        <User className="h-10 w-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-xl text-primary-foreground shadow-lg border-2 border-background hover:scale-110 transition-transform">
                                        <Camera className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-foreground">Personal Info</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Update your photo and basic identification details.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Full Name</Label>
                                    <Input
                                        value={profileFields.full_name}
                                        onChange={(e) => setProfileFields({ ...profileFields, full_name: e.target.value })}
                                        className="h-12 rounded-xl bg-primary/5 border-primary/10 focus-visible:ring-primary/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Email Address</Label>
                                    <Input disabled defaultValue={user?.email} className="h-12 rounded-xl bg-muted/50 border-border/50 opacity-60 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Role / Title</Label>
                                    <Input
                                        value={profileFields.role}
                                        onChange={(e) => setProfileFields({ ...profileFields, role: e.target.value })}
                                        className="h-12 rounded-xl bg-primary/5 border-primary/10 focus-visible:ring-primary/20 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Professional ID</Label>
                                    <Input disabled defaultValue={user?.id?.slice(0, 12).toUpperCase()} className="h-12 rounded-xl bg-muted/50 border-border/50 opacity-60 font-mono text-[10px]" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'org' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-[32px] p-8 space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-foreground">Organization</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Public details about your hiring company.</p>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold px-3 py-1">VERIFIED ENTITY</Badge>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Company Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input
                                            value={orgFields.name}
                                            onChange={(e) => setOrgFields({ ...orgFields, name: e.target.value })}
                                            className="h-12 pl-11 rounded-xl bg-primary/5 border-primary/10 focus-visible:ring-primary/20 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Website</Label>
                                        <Input
                                            value={orgFields.website_url}
                                            onChange={(e) => setOrgFields({ ...orgFields, website_url: e.target.value })}
                                            className="h-12 rounded-xl bg-primary/5 border-primary/10 focus-visible:ring-primary/20 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Hiring Region</Label>
                                        <Input
                                            value={orgFields.region}
                                            onChange={(e) => setOrgFields({ ...orgFields, region: e.target.value })}
                                            className="h-12 rounded-xl bg-primary/5 border-primary/10 focus-visible:ring-primary/20 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-[32px] p-8 space-y-8"
                        >
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-foreground">Security</h3>
                                <p className="text-sm text-muted-foreground font-medium">Manage your account password and security settings.</p>
                            </div>

                            <div className="space-y-6 max-w-md">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">New Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter new password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        className="h-12 rounded-xl bg-primary/5 border-primary/10 focus-visible:ring-primary/20 font-bold"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold h-11 px-6 shadow-sm shadow-primary/5"
                                    onClick={async () => {
                                        if (!passwords.new) {
                                            toast.error("Please enter a new password");
                                            return;
                                        }
                                        try {
                                            const { error } = await supabase.auth.updateUser({ password: passwords.new });
                                            if (error) throw error;
                                            toast.success("Password updated successfully");
                                            setPasswords({ current: "", new: "" });
                                        } catch (error: unknown) {
                                            const err = error as Error;
                                            toast.error(err.message || "Failed to update password");
                                        }
                                    }}
                                >
                                    Update Password
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-[32px] p-8 space-y-8"
                        >
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-foreground">Campaign Preferences</h3>
                                <p className="text-sm text-muted-foreground font-medium">Configure how you receive alerts and manage screenings.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-5 bg-primary/[0.03] border border-primary/10 rounded-2xl hover:bg-primary/[0.05] transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-foreground">Auto-Finalize Interviews</p>
                                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">IMMEDIATE EVALUATION AFTER COMPLETION</p>
                                    </div>
                                    <Switch
                                        checked={preferences.autoFinalize}
                                        onCheckedChange={(val) => setPreferences({ ...preferences, autoFinalize: val })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-5 bg-primary/[0.03] border border-primary/10 rounded-2xl hover:bg-primary/[0.05] transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-foreground">Public Hiring Page</p>
                                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">ALLOW GUESTS TO BROWSE RECENT JOBS</p>
                                    </div>
                                    <Switch
                                        checked={preferences.publicPage}
                                        onCheckedChange={(val) => setPreferences({ ...preferences, publicPage: val })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-5 bg-primary/[0.03] border border-primary/10 rounded-2xl hover:bg-primary/[0.05] transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-foreground">Candidate Email Alerts</p>
                                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">GET NOTIFIED WHEN SOMEONE COMPLETES A SCREENING</p>
                                    </div>
                                    <Switch
                                        checked={preferences.emailAlerts}
                                        onCheckedChange={(val) => setPreferences({ ...preferences, emailAlerts: val })}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-border/40 mt-12 bg-transparent">
                        <Button
                            variant="ghost"
                            className="w-full sm:w-auto rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 h-12 px-8"
                            onClick={() => {
                                if (profile) {
                                    setProfileFields({
                                        full_name: profile.full_name || "",
                                        role: "Recruitment Lead"
                                    });
                                }
                                if (org) {
                                    setOrgFields({
                                        name: org.name || "",
                                        website_url: org.website_url || "",
                                        region: "Global / Remote"
                                    });
                                }
                                toast.info("Changes discarded");
                            }}
                        >
                            Discard Changes
                        </Button>
                        <Button
                            className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground rounded-xl h-12 px-12 gap-2 shadow-xl shadow-primary/20 font-black transition-all active:scale-95"
                            onClick={handleSave}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Updating...
                                </div>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save All Settings
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
