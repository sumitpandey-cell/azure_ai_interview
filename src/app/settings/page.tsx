'use client'
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
    Loader2,
    BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import { DeactivateAccountModal } from "@/components/DeactivateAccountModal";
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
import { useSubscription } from "@/hooks/use-subscription";
import { formatDurationShort } from "@/lib/format-duration";
import { subscriptionService } from "@/services/subscription.service";
import { Tables } from "@/integrations/supabase/types";
import { ArrowUpRight, ArrowDownLeft, Receipt, Clock } from "lucide-react";
import { format } from "date-fns";

type SettingsSection = "general" | "appearance" | "notifications" | "security" | "billing";

type TransactionItem = Tables<"subscriptions"> & { plans?: { name: string } | null };

export default function Settings() {
    const { user, loading: authLoading } = useAuth();
    const { fetchProfile } = useOptimizedQueries();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<SettingsSection>("general");
    const { remaining_seconds, plan_name, loading: subscriptionLoading } = useSubscription();

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

    // Billing settings
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    // Deactivation modal
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);



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



            // Set notification states
            setEmailNotifications(user.user_metadata?.email_notifications ?? true);
            setInterviewReminders(user.user_metadata?.interview_reminders ?? true);
            setWeeklyReports(user.user_metadata?.weekly_reports ?? true);
            setMarketingEmails(user.user_metadata?.marketing_emails ?? false);

            // Fetch transactions if on billing section
            if (activeSection === "billing") {
                fetchTransactions();
            }
        }
    }, [user, activeSection]);

    const fetchTransactions = async () => {
        if (!user?.id) return;
        try {
            setTransactionsLoading(true);
            const data = await subscriptionService.getTransactions(user.id);
            setTransactions(data);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setTransactionsLoading(false);
        }
    };

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

    const handleDeactivateAccount = async (reason?: string) => {
        if (!user?.id) return;

        try {
            setLoading(true);

            const response = await fetch("/api/account/deactivate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Account deactivated", {
                    description: "You can reactivate anytime by logging back in."
                });
                // User will be signed out by the API
                router.push("/");
            } else {
                toast.error(data.error || "Failed to deactivate account");
            }
        } catch (error: any) {
            console.error("Error deactivating account:", error);
            toast.error(error.message || "Failed to deactivate account");
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
            <div className="w-full space-y-8 pb-12 mx-auto sm:pt-0">
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
                                    <CardTitle className="text-destructive">Deactivate Account</CardTitle>
                                    <CardDescription>
                                        Temporarily deactivate your account. You can reactivate it anytime by logging back in. All your data will be preserved.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowDeactivateModal(true)}
                                        disabled={loading}
                                    >
                                        Deactivate My Account
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Deactivate Account Modal */}
                            <DeactivateAccountModal
                                isOpen={showDeactivateModal}
                                onClose={() => setShowDeactivateModal(false)}
                                onConfirm={handleDeactivateAccount}
                            />
                        </div>
                    )}

                    {activeSection === "billing" && (
                        <div className="space-y-6">
                            <Card className="border-border shadow-sm overflow-hidden">
                                <div className="bg-primary/5 p-8 border-b border-border flex items-center gap-6">
                                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <CreditCard className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-foreground">Current Balance</h3>
                                        <p className="text-sm text-muted-foreground">Permanent credits that never expire.</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="text-3xl font-black text-primary tabular-nums">
                                            {subscriptionLoading ? <Loader2 className="h-8 w-8 animate-spin inline" /> : `${Math.floor(remaining_seconds / 60)} min`}
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Available Time</p>
                                    </div>
                                </div>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Active Plan</Label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-foreground">{plan_name || "Free"}</span>
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">Active</Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Pricing Type</Label>
                                                <div className="text-foreground font-medium">Pay-as-you-go Credits</div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 pt-2">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Out of credits? Top up your balance anytime. Your purchased minutes are permanent and won't expire at the end of the month.
                                            </p>
                                            <Button className="w-full sm:w-auto" onClick={() => router.push('/pricing')}>
                                                Top Up Balance
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle>Order History</CardTitle>
                                    <CardDescription>History of your credit purchases and top-ups.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {transactionsLoading ? (
                                        <div className="p-8 space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <div className="space-y-2 flex-1">
                                                        <Skeleton className="h-4 w-1/4" />
                                                        <Skeleton className="h-3 w-1/2" />
                                                    </div>
                                                    <Skeleton className="h-4 w-16" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : transactions.length > 0 ? (
                                        <div className="divide-y divide-border">
                                            {transactions
                                                .map((tx) => {
                                                    const isPurchase = !!tx.plan_id;
                                                    const planName = tx.plans?.name || "Welcome Bonus";

                                                    return (
                                                        <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                                                                isPurchase ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                                                    "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                                                            )}>
                                                                {isPurchase ? <ArrowUpRight className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-foreground truncate">{planName}</p>
                                                                    {isPurchase && <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase font-black tracking-tighter">Verified</Badge>}
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground font-medium">
                                                                    {format(new Date(tx.created_at), "MMM d, yyyy • h:mm a")}
                                                                </p>
                                                            </div>

                                                            <div className="text-right">
                                                                <p className="text-sm font-black tabular-nums text-emerald-500">
                                                                    +{Math.floor(tx.plan_seconds / 60)} min
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{isPurchase ? "Purchase" : "System"}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <Receipt className="h-8 w-8 opacity-20" />
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground mb-1">No transactions yet</h3>
                                            <p className="text-sm max-w-[250px]">Your credit top-ups and usage will appear here.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

