'use client'
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    User,
    Bell,
    Shield,
    Trash2,
    Upload,
    CreditCard,
    Palette,
    Settings as SettingsIcon,
    ChevronRight,
    Sparkles,
    Lock,
    Mail,
    Globe,
    ExternalLink,
    Copy
} from "lucide-react";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from 'browser-image-compression';
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getPreferredLanguage, type LanguageOption } from "@/lib/language-config";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { profileService } from "@/services/profile.service";
import { interviewService } from "@/services/interview.service";
import { useRouter } from "next/navigation";

type SettingsSection = "general" | "appearance" | "notifications" | "security" | "billing";

export default function Settings() {
    const { user } = useAuth();
    const { fetchProfile } = useOptimizedQueries();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<SettingsSection>("general");

    // Profile settings
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
    const [gender, setGender] = useState(user?.user_metadata?.gender || "");
    const [email, setEmail] = useState(user?.email || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || user?.user_metadata?.picture);

    // Language settings
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(getPreferredLanguage());

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [interviewReminders, setInterviewReminders] = useState(true);
    const [weeklyReports, setWeeklyReports] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    // Account settings
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Privacy settings
    const [isPublic, setIsPublic] = useState(false);

    const router = useRouter();

    // Sync state with user data when it loads
    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || "");
            setGender(user.user_metadata?.gender || "");
            setEmail(user.email || "");
            setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture);

            // Fetch profile for additional fields (like isPublic)
            profileService.getProfile(user.id).then(profile => {
                if (profile) setIsPublic(profile.is_public);
            });
        }
    }, [user]);

    const handleLanguageChange = (language: LanguageOption) => {
        setSelectedLanguage(language);
        toast.success(`Language changed to ${language.name}`);
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            setLoading(true);
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 500,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);

            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `avatar.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            const profileData = await profileService.updateProfile(user.id, {
                avatar_url: publicUrl
            });

            if (!profileData) {
                throw new Error('Failed to update profile in database');
            }

            setAvatarUrl(publicUrl);
            await fetchProfile(true); // Refresh cache
            toast.success("Profile picture updated successfully!");
        } catch (error: any) {
            console.error("Error updating profile picture:", error);
            toast.error(error.message || "Failed to update profile picture");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Update auth metadata
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    gender: gender
                }
            });

            if (error) throw error;

            // Update profile using service
            const profileData = await profileService.updateProfile(user.id, {
                full_name: fullName
            });

            if (!profileData) {
                throw new Error('Failed to update profile');
            }

            await fetchProfile(true); // Refresh cache
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePrivacy = async (checked: boolean) => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const success = await profileService.setProfileVisibility(user.id, checked);
            if (success) {
                setIsPublic(checked);
                toast.success(`Profile is now ${checked ? 'Public' : 'Private'}`);
            } else {
                throw new Error("Failed to update visibility");
            }
        } catch (error: any) {
            console.error("Error toggling privacy:", error);
            toast.error(error.message || "Failed to update privacy settings");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        // Check if user signed up with OAuth (no password set)
        const isOAuthUser = user?.app_metadata?.provider !== 'email';

        // For OAuth users, they don't need current password
        if (!isOAuthUser) {
            if (!currentPassword) {
                toast.error("Please enter your current password");
                return;
            }
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            const successMessage = isOAuthUser
                ? "Password set successfully! You can now login with email and password."
                : "Password updated successfully!";

            toast.success(successMessage);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user?.id) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setLoading(true);

            // Get all user sessions
            const sessions = await interviewService.getUserSessions(user.id);

            // Delete all sessions using service
            for (const session of sessions) {
                await interviewService.deleteSession(session.id);
            }

            toast.info("Please contact support to complete account deletion.");
        } catch (error: any) {
            console.error("Error deleting account:", error);
            toast.error(error.message || "Failed to delete account");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = () => {
        toast.success("Notification preferences saved!");
    };

    const tabs = [
        { id: "general", label: "General", icon: User, desc: "Personal info & profile" },
        { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme & customization" },
        { id: "notifications", label: "Notifications", icon: Bell, desc: "Alerts & updates" },
        { id: "security", label: "Security", icon: Shield, desc: "Password & privacy" },
        { id: "billing", label: "Billing", icon: CreditCard, desc: "Plans & payments" },
    ];

    return (
        <DashboardLayout>
            <div className="w-full space-y-6 sm:space-y-10 pb-12 mx-auto pt-10 sm:pt-0">
                {/* Modern Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-2">
                        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary border border-primary/20 mb-2">
                            <SettingsIcon className="mr-2 h-3 w-3" />
                            Control Center
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                            Account <span className="text-primary italic">Settings</span>
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-lg">
                            Fine-tune your experience and manage your global preferences.
                        </p>
                    </div>
                </div>

                {/* Horizontal Tab Navigation */}
                <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeSection === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as SettingsSection)}
                                className={cn(
                                    "px-5 py-3 rounded-2xl transition-all duration-500 border flex items-center gap-3 relative overflow-hidden shrink-0 group",
                                    isActive
                                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]"
                                        : "bg-white/5 border-white/5 text-muted-foreground/60 hover:border-white/20 hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-500",
                                    isActive ? "bg-primary/20" : "bg-white/5 group-hover:bg-primary/10"
                                )}>
                                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "group-hover:text-primary")} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-black uppercase tracking-widest leading-none whitespace-nowrap">
                                        {tab.label}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] font-medium leading-none opacity-60 mt-0.5 whitespace-nowrap hidden sm:block",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {tab.desc}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeSection === "general" && (
                        <div className="space-y-8">
                            <Card className="border-2 border-border/50 shadow-2xl bg-card rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                                <div className="h-20 sm:h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent relative">
                                    <div className="absolute inset-0 bg-grid-white/5 opacity-20" />
                                </div>
                                <CardContent className="p-4 sm:p-10 -mt-12 sm:-mt-16 relative">
                                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-8 mb-6 sm:mb-10">
                                        <div className="relative group">
                                            <Label htmlFor="avatar-upload" className="cursor-pointer block relative">
                                                <Avatar className="h-24 w-24 sm:h-40 sm:w-40 border-4 sm:border-8 border-card shadow-[0_0_50px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-all duration-500">
                                                    <AvatarImage src={getAvatarUrl(avatarUrl, user?.id || 'user', 'avataaars', null, gender)} />
                                                    <AvatarFallback className="text-3xl sm:text-5xl font-black bg-primary/10 text-primary uppercase">
                                                        {getInitials(fullName) || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute inset-4 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-md">
                                                    <Upload className="h-8 w-8 text-white animate-bounce" />
                                                </div>
                                            </Label>
                                            <Input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="flex-1 text-center md:text-left space-y-3">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                                <Sparkles className="h-3 w-3" />
                                                Verified Candidate
                                            </div>
                                            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">{fullName || "User Identity"}</h1>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                                <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs sm:text-sm">
                                                    <Mail className="h-4 w-4 text-primary" />
                                                    {email}
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs sm:text-sm">
                                                    <Globe className="h-4 w-4 text-primary" />
                                                    Neutral AI Mode
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="mb-6 sm:mb-10 opacity-50" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Account Name</Label>
                                                <Input
                                                    id="fullName"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="h-10 sm:h-14 bg-muted/30 border-2 border-border/50 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-bold text-sm focus:ring-primary focus:border-primary transition-all"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Candidate Profile</Label>
                                                <Select value={gender} onValueChange={setGender}>
                                                    <SelectTrigger className="h-10 sm:h-14 bg-muted/30 border-2 border-border/50 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-bold text-sm focus:ring-primary transition-all">
                                                        <SelectValue placeholder="Identification" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-2 border-border/50 shadow-2xl">
                                                        <SelectItem value="male" className="rounded-xl font-bold">Male</SelectItem>
                                                        <SelectItem value="female" className="rounded-xl font-bold">Female</SelectItem>
                                                        <SelectItem value="other" className="rounded-xl font-bold">Other / Undisclosed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Secure Email</Label>
                                                <div className="relative group/input">
                                                    <Input
                                                        id="email"
                                                        value={email}
                                                        disabled
                                                        className="h-10 sm:h-14 bg-muted/10 border-2 border-border/30 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-bold text-sm text-muted-foreground/50 cursor-not-allowed"
                                                    />
                                                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Global Language</Label>
                                                <LanguageSelector
                                                    selectedLanguage={selectedLanguage}
                                                    onLanguageChange={handleLanguageChange}
                                                    className="h-10 sm:h-14 bg-muted/30 border-2 border-border/50 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-bold text-sm focus:ring-primary transition-all w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 sm:mt-12 flex justify-end">
                                        <Button
                                            onClick={handleUpdateProfile}
                                            disabled={loading}
                                            className="h-10 sm:h-14 px-6 sm:px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            {loading ? "Syncing..." : "Publish Updates"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-border/50 shadow-xl bg-card rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                                <CardContent className="p-4 sm:p-10 space-y-6 sm:space-y-8">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Public Presence</h3>
                                            <p className="text-sm text-muted-foreground font-medium max-w-md">
                                                Showcase your achievements and metrics to the professional community.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-3xl border-2 border-border/50">
                                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Privacy Mode</span>
                                            <Switch
                                                id="public-profile"
                                                checked={isPublic}
                                                onCheckedChange={handleTogglePrivacy}
                                                disabled={loading}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    </div>

                                    {isPublic && (
                                        <div className="space-y-6 p-8 bg-primary/5 rounded-[2rem] border-2 border-primary/20 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                                <div className="space-y-1 flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Live Profile URL</p>
                                                    <div className="text-sm font-mono font-bold break-all opacity-60">
                                                        {window.location.origin}/p/{user?.id}
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        className="rounded-xl border-2 font-bold gap-2"
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/p/${user?.id}`;
                                                            navigator.clipboard.writeText(url);
                                                            toast.success("Identity URL copied!");
                                                        }}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                        Copy Link
                                                    </Button>
                                                    <Button
                                                        className="rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/10 gap-2"
                                                        onClick={() => window.open(`/p/${user?.id}`, '_blank')}
                                                    >
                                                        Preview Page
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === "appearance" && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                            <AppearanceSettings />
                        </div>
                    )}

                    {activeSection === "notifications" && (
                        <Card className="border-2 border-border/50 shadow-2xl bg-card rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-10">
                            <CardHeader className="p-0 mb-6 sm:mb-10">
                                <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight">Broadcast Center</CardTitle>
                                <CardDescription className="text-sm font-medium">Control the frequency and type of incoming intel.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-6">
                                {[
                                    {
                                        id: "email-notifications",
                                        label: "Master Broadcast",
                                        desc: "Global toggle for all email security and activity alerts.",
                                        checked: emailNotifications,
                                        onChange: setEmailNotifications
                                    },
                                    {
                                        id: "interview-reminders",
                                        label: "T-Minus Reminders",
                                        desc: "High-priority alerts 1 hour before scheduled sessions.",
                                        checked: interviewReminders,
                                        onChange: setInterviewReminders
                                    },
                                    {
                                        id: "weekly-reports",
                                        label: "Analytics Reports",
                                        desc: "Deep-dive summary of your performance metrics every week.",
                                        checked: weeklyReports,
                                        onChange: setWeeklyReports
                                    },
                                    {
                                        id: "marketing-emails",
                                        label: "System Pulse",
                                        desc: "Real-time updates on new experimental features and AI modules.",
                                        checked: marketingEmails,
                                        onChange: setMarketingEmails
                                    }
                                ].map((item, i) => (
                                    <div key={item.id} className="group">
                                        <div className="flex items-center justify-between p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-muted/20 border-2 border-transparent hover:border-border/50 hover:bg-muted/30 transition-all duration-300">
                                            <div className="space-y-1">
                                                <Label htmlFor={item.id} className="text-base sm:text-lg font-black tracking-tight">
                                                    {item.label}
                                                </Label>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                                    {item.desc}
                                                </p>
                                            </div>
                                            <Switch
                                                id={item.id}
                                                checked={item.checked}
                                                onCheckedChange={item.onChange}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                        {i < 3 && <div className="h-px bg-border/30 my-2 mx-10" />}
                                    </div>
                                ))}
                                <div className="pt-6 sm:pt-10 flex justify-end">
                                    <Button
                                        onClick={handleSaveNotifications}
                                        className="h-10 sm:h-14 px-6 sm:px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                                    >
                                        Save Protocol
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeSection === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                            <Card className="border-2 border-border/50 shadow-2xl bg-card rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-10">
                                <CardHeader className="p-0 mb-6 sm:mb-10">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Shield className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-3xl font-black tracking-tight">
                                            {user?.app_metadata?.provider !== 'email' ? 'Vault Access' : 'Security Clearance'}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm font-medium">
                                        {user?.app_metadata?.provider !== 'email'
                                            ? 'Configure a permanent password for direct email authentication.'
                                            : 'Secure your identity with a high-entropy password rotation.'
                                        }
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 space-y-8">
                                    {user?.app_metadata?.provider !== 'email' && (
                                        <div className="bg-primary/5 border-2 border-primary/20 rounded-[2rem] p-6 mb-8 flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-widest text-primary mb-1">Authenticated via {user?.app_metadata?.provider || 'Auth Hub'}</p>
                                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                                    Establishing a password allows you to bridge your social identity with direct platform login.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6 max-w-2xl">
                                        {user?.app_metadata?.provider === 'email' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="current-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Current Password</Label>
                                                <Input
                                                    id="current-password"
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="h-10 sm:h-14 bg-muted/30 border-2 border-border/50 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-bold text-sm"
                                                    placeholder="Verify existing credentials"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                                    {user?.app_metadata?.provider !== 'email' ? 'New Security Key' : 'Replacement Password'}
                                                </Label>
                                                <Input
                                                    id="new-password"
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="h-10 sm:h-14 bg-muted/30 border-2 border-border/50 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-bold text-sm"
                                                    placeholder="Minimum 6 characters"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Confirm Identity Key</Label>
                                                <Input
                                                    id="confirm-password"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="h-10 sm:h-14 bg-muted/30 border-2 border-border/50 rounded-xl sm:rounded-2xl px-4 sm:px-5 font-bold text-sm"
                                                    placeholder="Must match exactly"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 sm:pt-10 flex justify-end">
                                        <Button
                                            onClick={handleUpdatePassword}
                                            disabled={loading}
                                            className="h-10 sm:h-14 px-6 sm:px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                                        >
                                            {loading ? "Establishing..." : (user?.app_metadata?.provider !== 'email' ? 'Set Access Key' : 'Apply Security Update')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-destructive/20 bg-destructive/5 shadow-2xl rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-10 overflow-hidden relative">
                                <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-destructive/10 to-transparent pointer-events-none" />
                                <div className="relative z-10 space-y-6 sm:space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-destructive">
                                            <Trash2 className="h-6 w-6 animate-pulse" />
                                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Self-Destruct Account</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm font-medium text-destructive/70 max-w-2xl">
                                            Permanent termination of your candidate identity, interview history, analytics, and all associated metadata. This operation is irreversible.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-card/40 border-2 border-destructive/10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-destructive/80">Confirm Intent</p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteAccount}
                                            className="h-10 sm:h-12 px-6 sm:px-8 font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl shadow-xl shadow-destructive/20 transition-all hover:scale-105"
                                        >
                                            Delete My Data
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeSection === "billing" && (
                        <Card className="border-2 border-border/50 shadow-2xl bg-card rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-right-4 duration-700">
                            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl sm:rounded-[2.5rem] bg-muted/50 border-2 border-border/50 flex items-center justify-center mb-6 sm:mb-10 group-hover:rotate-12 transition-all duration-700">
                                <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-30" />
                            </div>
                            <h3 className="text-2xl sm:text-4xl font-black tracking-tight mb-3 sm:mb-4">No Active License</h3>
                            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-sm mb-8 sm:mb-12 leading-relaxed">
                                You are currently operating on our base-tier plan. Unlock the full AI potential with a professional license.
                            </p>
                            <Button
                                onClick={() => router.push('/pricing')}
                                className="h-12 sm:h-16 px-8 sm:px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95"
                            >
                                View Licensing Options
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

