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
import { User, Bell, Shield, Trash2, Upload, CreditCard } from "lucide-react";
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

type SettingsSection = "general" | "notifications" | "security" | "billing";

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
        { id: "general", label: "General", icon: User },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
        { id: "billing", label: "Billing", icon: CreditCard },
    ];

    return (
        <DashboardLayout>
            <div className="w-full space-y-4 pb-10">
                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-muted-foreground text-xs">
                        Manage your account settings and preferences.
                    </p>
                </div>

                {/* Top Bar Navigation */}
                <div className="border-b border-border bg-card rounded-t-xl">
                    <nav className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeSection === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSection(tab.id as SettingsSection)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 relative",
                                        isActive
                                            ? "text-primary border-primary bg-primary/5"
                                            : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="space-y-4">
                    {activeSection === "general" && (
                        <Card className="border-none shadow-sm bg-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Profile Information</CardTitle>
                                <CardDescription className="text-xs">Update your photo and personal details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="relative group">
                                        <Label htmlFor="avatar-upload" className="cursor-pointer block relative">
                                            <Avatar className="h-20 w-20 border-4 border-background shadow-xl group-hover:opacity-90 transition-all">
                                                <AvatarImage src={getAvatarUrl(avatarUrl, user?.id || 'user', 'avataaars', null, gender)} />
                                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                                    {getInitials(fullName) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                                                <Upload className="h-5 w-5 text-white" />
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
                                    <div className="space-y-0.5 text-center sm:text-left">
                                        <h3 className="font-bold text-lg text-foreground">{fullName || "User"}</h3>
                                        <p className="text-xs text-muted-foreground">{email}</p>
                                        <p className="text-xs text-primary font-medium mt-1">Free Plan</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-4 max-w-xl">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="max-w-md"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gender" className="text-sm">Gender</Label>
                                        <Select value={gender} onValueChange={setGender}>
                                            <SelectTrigger className="max-w-md">
                                                <SelectValue placeholder="Select your gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm">Email Address</Label>
                                        <Input
                                            id="email"
                                            value={email}
                                            disabled
                                            className="max-w-md bg-muted"
                                        />
                                    </div>

                                    <Separator />

                                    {/* Language Preferences */}
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="text-sm font-medium">Language Preferences</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Choose your preferred language for interviews
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm">Interview Language</Label>
                                            <LanguageSelector
                                                selectedLanguage={selectedLanguage}
                                                onLanguageChange={handleLanguageChange}
                                                className="max-w-md"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                This language will be used for speech recognition and AI communication during interviews.
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Privacy Settings */}
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium">Privacy & Public Profile</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Control who can see your interview achievements.
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="public-profile" className="text-sm font-semibold">Make Profile Public</Label>
                                                <p className="text-[10px] text-muted-foreground max-w-[250px]">
                                                    Allow anyone with the link to view your rank, scores, and badges.
                                                </p>
                                            </div>
                                            <Switch
                                                id="public-profile"
                                                checked={isPublic}
                                                onCheckedChange={handleTogglePrivacy}
                                                disabled={loading}
                                            />
                                        </div>

                                        {isPublic && (
                                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Your Public Link</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-[10px]"
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/p/${user?.id}`;
                                                            navigator.clipboard.writeText(url);
                                                            toast.success("Link copied!");
                                                        }}
                                                    >
                                                        Copy Link
                                                    </Button>
                                                </div>
                                                <div className="text-xs font-mono bg-white dark:bg-black/40 p-2 rounded border truncate text-muted-foreground">
                                                    {window.location.origin}/p/{user?.id}
                                                </div>
                                                <Button
                                                    variant="link"
                                                    className="text-xs p-0 h-auto justify-start text-primary"
                                                    onClick={() => window.open(`/p/${user?.id}`, '_blank')}
                                                >
                                                    View Live Profile →
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <Button onClick={handleUpdateProfile} disabled={loading} size="sm">
                                            {loading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeSection === "notifications" && (
                        <Card className="border-none shadow-sm bg-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Notification Preferences</CardTitle>
                                <CardDescription className="text-xs">Choose what we communicate to you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    {
                                        id: "email-notifications",
                                        label: "Email Notifications",
                                        desc: "Receive emails about your account activity.",
                                        checked: emailNotifications,
                                        onChange: setEmailNotifications
                                    },
                                    {
                                        id: "interview-reminders",
                                        label: "Interview Reminders",
                                        desc: "Get reminded 1 hour before your sessions.",
                                        checked: interviewReminders,
                                        onChange: setInterviewReminders
                                    },
                                    {
                                        id: "weekly-reports",
                                        label: "Weekly Reports",
                                        desc: "A weekly summary of your progress.",
                                        checked: weeklyReports,
                                        onChange: setWeeklyReports
                                    },
                                    {
                                        id: "marketing-emails",
                                        label: "Product Updates",
                                        desc: "News about new features and improvements.",
                                        checked: marketingEmails,
                                        onChange: setMarketingEmails
                                    }
                                ].map((item, i) => (
                                    <div key={item.id}>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="space-y-0.5">
                                                <Label htmlFor={item.id} className="text-sm font-medium">
                                                    {item.label}
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.desc}
                                                </p>
                                            </div>
                                            <Switch
                                                id={item.id}
                                                checked={item.checked}
                                                onCheckedChange={item.onChange}
                                            />
                                        </div>
                                        {i < 3 && <Separator className="mt-3" />}
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <Button onClick={handleSaveNotifications} size="sm">Save Preferences</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeSection === "security" && (
                        <div className="space-y-4">
                            <Card className="border-none shadow-sm bg-card">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {user?.app_metadata?.provider !== 'email' ? 'Set Password' : 'Change Password'}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {user?.app_metadata?.provider !== 'email'
                                            ? 'Set a password to enable email/password login in addition to your social login.'
                                            : 'Change your password to keep your account secure.'
                                        }
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-w-xl">
                                    {/* Show provider info for OAuth users */}
                                    {user?.app_metadata?.provider !== 'email' && (
                                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                                            <div className="flex items-start gap-2">
                                                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                                        Signed in with {user?.app_metadata?.provider ? user.app_metadata.provider.charAt(0).toUpperCase() + user.app_metadata.provider.slice(1) : 'OAuth'}
                                                    </p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                                        Setting a password will allow you to login with your email and password as well.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Only show current password for email/password users */}
                                    {user?.app_metadata?.provider === 'email' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="current-password" className="text-sm">Current Password</Label>
                                            <Input
                                                id="current-password"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter your current password"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="new-password" className="text-sm">
                                            {user?.app_metadata?.provider !== 'email' ? 'Password' : 'New Password'}
                                        </Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min. 6 characters)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm your new password"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <Button onClick={handleUpdatePassword} disabled={loading} size="sm">
                                            {loading ? "Saving..." : (user?.app_metadata?.provider !== 'email' ? 'Set Password' : 'Update Password')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-destructive flex items-center gap-2 text-base">
                                        <Trash2 className="h-4 w-4" />
                                        Delete Account
                                    </CardTitle>
                                    <CardDescription className="text-destructive/80 text-xs">
                                        Permanently delete your account and all of your content.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <p className="text-xs text-destructive/80 max-w-md">
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                        <Button variant="destructive" onClick={handleDeleteAccount} size="sm">
                                            Delete Account
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeSection === "billing" && (
                        <Card className="border-none shadow-sm bg-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Billing & Plans</CardTitle>
                                <CardDescription className="text-xs">Manage your subscription and payment methods.</CardDescription>
                            </CardHeader>
                            <CardContent className="py-8 text-center">
                                <div className="mx-auto w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                                    <CreditCard className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-semibold mb-1">No Active Subscription</h3>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                                    You are currently on the free plan. Upgrade to unlock premium features like unlimited interviews and advanced analytics.
                                </p>
                                <Button onClick={() => router.push('/pricing')} variant="outline" size="sm">View Plans</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
