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
    Copy,
    Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
    const { user, loading: authLoading } = useAuth();
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
    const [emailNotifications, setEmailNotifications] = useState(user?.user_metadata?.email_notifications ?? true);
    const [interviewReminders, setInterviewReminders] = useState(user?.user_metadata?.interview_reminders ?? true);
    const [weeklyReports, setWeeklyReports] = useState(user?.user_metadata?.weekly_reports ?? true);
    const [marketingEmails, setMarketingEmails] = useState(user?.user_metadata?.marketing_emails ?? false);

    // Account settings
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Privacy settings
    const [isPublic, setIsPublic] = useState(false);

    // AI Lab features
    const [sentimentEnabled, setSentimentEnabled] = useState(user?.user_metadata?.sentiment_analysis_enabled || false);

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

            setSentimentEnabled(user.user_metadata?.sentiment_analysis_enabled || false);

            // Set notification states
            setEmailNotifications(user.user_metadata?.email_notifications ?? true);
            setInterviewReminders(user.user_metadata?.interview_reminders ?? true);
            setWeeklyReports(user.user_metadata?.weekly_reports ?? true);
            setMarketingEmails(user.user_metadata?.marketing_emails ?? false);
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

    const handleToggleSentiment = async (checked: boolean) => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                data: { sentiment_analysis_enabled: checked }
            });

            if (error) throw error;
            setSentimentEnabled(checked);
            toast.success(`Confidence Analysis ${checked ? 'Enabled' : 'Disabled'}`);
        } catch (error: any) {
            console.error("Error toggling sentiment:", error);
            toast.error(error.message || "Failed to update AI settings");
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
            "Are you sure you want to delete your data? This will remove your interview history. To fully delete your account, please contact support."
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

            toast.success("Interview data removed", {
                description: "Your session history has been cleared. Contact support for full account closure."
            });
        } catch (error: any) {
            console.error("Error deleting data:", error);
            toast.error(error.message || "Failed to clear data");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                data: {
                    email_notifications: emailNotifications,
                    interview_reminders: interviewReminders,
                    weekly_reports: weeklyReports,
                    marketing_emails: marketingEmails
                }
            });

            if (error) throw error;
            toast.success("Notification preferences saved!");
        } catch (error: any) {
            console.error("Error saving notifications:", error);
            toast.error(error.message || "Failed to save notification preferences");
        } finally {
            setLoading(false);
        }
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
            <div className="w-full space-y-8 pb-12 mx-auto pt-10 sm:pt-0">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-muted-foreground text-lg">Manage your account settings and preferences.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeSection === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as SettingsSection)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative rounded-t-lg",
                                    isActive
                                        ? "text-primary border-b-2 border-primary bg-primary/5"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeSection === "general" && (
                        <div className="space-y-6">
                            <Card className="border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your photo and personal details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <Avatar className="h-24 w-24 border-2 border-border">
                                                <AvatarImage src={getAvatarUrl(avatarUrl, user?.id || 'user', 'avataaars', null, gender)} />
                                                <AvatarFallback className="text-xl">
                                                    {getInitials(fullName) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Label
                                                htmlFor="avatar-upload"
                                                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium"
                                            >
                                                Change
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
                                        <div className="space-y-1">
                                            <h3 className="font-medium text-lg">{fullName || "User"}</h3>
                                            <p className="text-sm text-muted-foreground">{email}</p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <Select value={gender} onValueChange={setGender}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Prefer not to say</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                value={email}
                                                disabled
                                                className="bg-muted text-muted-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Language Support</Label>
                                            <LanguageSelector
                                                selectedLanguage={selectedLanguage}
                                                onLanguageChange={handleLanguageChange}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleUpdateProfile} disabled={loading}>
                                            {loading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Public Profile</CardTitle>
                                            <CardDescription>Manage your public visibility.</CardDescription>
                                        </div>
                                        <Switch
                                            checked={isPublic}
                                            onCheckedChange={handleTogglePrivacy}
                                            disabled={loading}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isPublic && (
                                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm">
                                            <div className="flex-1 font-mono truncate text-muted-foreground">
                                                {window.location.origin}/p/{user?.id}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/p/${user?.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success("Copied to clipboard");
                                                    }}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(`/p/${user?.id}`, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>AI Analysis Features</CardTitle>
                                            <CardDescription>Enable experimental features like sentiment analysis.</CardDescription>
                                        </div>
                                        <Switch
                                            checked={sentimentEnabled}
                                            onCheckedChange={handleToggleSentiment}
                                            disabled={loading}
                                        />
                                    </div>
                                </CardHeader>
                            </Card>
                        </div>
                    )}

                    {activeSection === "appearance" && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                            <AppearanceSettings />
                        </div>
                    )}

                    {activeSection === "notifications" && (
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Choose what updates you want to receive.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {[
                                    {
                                        id: "email-notifications",
                                        label: "Email Notifications",
                                        desc: "Receive updates about your account activity.",
                                        checked: emailNotifications,
                                        onChange: setEmailNotifications
                                    },
                                    {
                                        id: "interview-reminders",
                                        label: "Interview Reminders",
                                        desc: "Get reminded 1 hour before scheduled sessions.",
                                        checked: interviewReminders,
                                        onChange: setInterviewReminders
                                    },
                                    {
                                        id: "weekly-reports",
                                        label: "Weekly Reports",
                                        desc: "Receive a summary of your weekly progress.",
                                        checked: weeklyReports,
                                        onChange: setWeeklyReports
                                    },
                                    {
                                        id: "marketing-emails",
                                        label: "Product Updates",
                                        desc: "Stay informed about new features and improvements.",
                                        checked: marketingEmails,
                                        onChange: setMarketingEmails
                                    }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor={item.id} className="text-base">
                                                {item.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {item.desc}
                                            </p>
                                        </div>
                                        <Switch
                                            id={item.id}
                                            checked={item.checked}
                                            onCheckedChange={item.onChange}
                                        />
                                    </div>
                                ))}
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveNotifications} disabled={loading}>
                                        Save Preferences
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeSection === "security" && (
                        <div className="space-y-6">
                            <Card className="border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle>Password</CardTitle>
                                    <CardDescription>
                                        {user?.app_metadata?.provider !== 'email'
                                            ? "You are logged in via a third-party provider. Set a password to also log in via email."
                                            : "Update your account password."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-w-md">
                                    {user?.app_metadata?.provider === 'email' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="current-password">Current Password</Label>
                                            <Input
                                                id="current-password"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <Button onClick={handleUpdatePassword} disabled={loading}>
                                            Update Password
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-red-200 dark:border-red-900/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Delete Account</CardTitle>
                                    <CardDescription>
                                        Permanently remove your account and all associated data. This action cannot be undone.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                    >
                                        Delete My Account
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === "billing" && (
                        <Card className="border-border shadow-sm">
                            <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">Free Plan</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        You are currently on the free plan. Upgrade to access premium features and unlimited interviews.
                                    </p>
                                </div>
                                <Button className="mt-4" onClick={() => router.push('/pricing')}>
                                    View Plans
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

