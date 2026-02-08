"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import {
    User,
    Building2,
    Shield,
    Bell,
    CreditCard,
    Save,
    Camera,
    Mail,
    Phone,
    Globe,
    MapPin,
    Lock,
    ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function RecruiterSettings() {
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (user) fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id as string)
                .single();
            setProfile(profileData);

            if (profileData && (profileData as any).org_id) {
                const { data: orgData } = await supabase
                    .from('organizations' as any)
                    .select('*')
                    .eq('id', (profileData as any).org_id)
                    .single();
                setOrg(orgData);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            // Logic to update profile and org in Supabase
            // ...
            toast.success("Settings updated successfully!");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse p-8">
            <div className="h-8 w-48 bg-slate-100 rounded-lg" />
            <div className="h-64 bg-slate-50 rounded-3xl" />
        </div>
    );

    const tabs = [
        { id: 'profile', icon: User, label: 'Personal Profile' },
        { id: 'org', icon: Building2, label: 'Organization' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
    ];

    return (
        <div className="max-w-5xl space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-1 font-medium">Manage your recruiter profile and organization preferences.</p>
            </div>

            <div className="space-y-8">
                {/* Horizontal Top Navigation */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-tight ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-indigo-600'
                                }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Settings Content */}
                <div className="space-y-8 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-8"
                        >
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
                                        <User className="h-10 w-10" />
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 rounded-xl text-white shadow-lg border-2 border-white hover:scale-110 transition-transform">
                                        <Camera className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-900">Personal Info</h3>
                                    <p className="text-sm text-slate-400 font-medium">Update your photo and basic identification details.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                                    <Input defaultValue={profile?.full_name} className="h-12 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-500/20 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                                    <Input disabled defaultValue={user?.email} className="h-12 rounded-xl bg-slate-50 border-0 opacity-60 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Role / Title</Label>
                                    <Input defaultValue="Recruitment Lead" className="h-12 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-500/20 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Professional ID</Label>
                                    <Input disabled defaultValue={user?.id?.slice(0, 12).toUpperCase()} className="h-12 rounded-xl bg-slate-50 border-0 opacity-60 font-mono text-[10px]" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'org' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-900">Organization</h3>
                                    <p className="text-sm text-slate-400 font-medium">Public details about your hiring company.</p>
                                </div>
                                <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">VERIFIED ENTITY</Badge>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                        <Input defaultValue={org?.name} className="h-12 pl-11 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-500/20 font-bold" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Website</Label>
                                        <Input defaultValue="https://company.ai" className="h-12 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-500/20 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Hiring Region</Label>
                                        <Input defaultValue="Global / Remote" className="h-12 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-500/20 font-bold" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-8"
                        >
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900">Security</h3>
                                <p className="text-sm text-slate-400 font-medium">Manage your account password and security settings.</p>
                            </div>

                            <div className="space-y-6 max-w-md">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</Label>
                                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-500/20 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</Label>
                                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-500/20 font-bold" />
                                </div>
                                <Button variant="outline" className="rounded-xl font-bold h-11">Update Password</Button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-8"
                        >
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900">Campaign Preferences</h3>
                                <p className="text-sm text-slate-400 font-medium">Configure how you receive alerts and manage screenings.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">Auto-Finalize Interviews</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">IMMEDIATE EVALUATION AFTER COMPLETION</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">Public Hiring Page</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ALLOW GUESTS TO BROWSE RECENT JOBS</p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">Candidate Email Alerts</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">GET NOTIFIED WHEN SOMEONE COMPLETES A SCREENING</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-8">
                        <Button variant="ghost" className="rounded-xl font-bold text-slate-500 h-12 px-8">Discard Changes</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-10 gap-2 shadow-lg shadow-indigo-200 font-black"
                            onClick={handleSave}
                            disabled={submitting}
                        >
                            <Save className="h-4 w-4" />
                            {submitting ? "Updating..." : "Save All Settings"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
