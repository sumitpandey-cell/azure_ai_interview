"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Copy,
    Check,
    Share2,
    MessageCircle,
    Send,
    Twitter,
    Linkedin,
    X
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    userName?: string;
}

const ReferralModal: React.FC<ReferralModalProps> = ({
    isOpen,
    onClose,
    userId = "user",
}) => {
    const [copied, setCopied] = useState(false);
    const [sharing, setSharing] = useState<string | null>(null);

    const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${userId}`;
    const shareMessage = `Hey! I've been practicing for my tech interviews on Arjuna AI and it's amazing! 🚀 Join me and let's ace our interviews together. Use my link to get started: ${referralLink}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnWhatsApp = async () => {
        setSharing('whatsapp');
        const message = encodeURIComponent(shareMessage);
        const whatsappUrl = `https://wa.me/?text=${message}`;

        try {
            // Efficiently fetch the local image from the public folder
            // No external storage (Supabase) needed for static assets like this.
            // This is the fastest and most cost-effective way.
            const response = await fetch('/dashboard-preview.png');
            const blob = await response.blob();
            const file = new File([blob], 'arjuna-ai.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    text: shareMessage,
                    title: "Arjuna AI"
                });
                setSharing(null);
                return;
            }
        } catch (error) {
            console.error("Error sharing image:", error);
        }

        // Fallback for Desktop or incompatible browsers
        toast.info("Image attachment is available on mobile. Sharing link instead.");
        window.open(whatsappUrl, "_blank");
        setSharing(null);
    };

    const shareOnTelegram = () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`;
        window.open(url, "_blank");
    };

    const shareOnTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        window.open(url, "_blank");
    };

    const shareOnLinkedIn = () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        window.open(url, "_blank");
    };

    const handleNativeShare = async () => {
        setSharing('native');
        if (navigator.share) {
            try {
                const response = await fetch('/dashboard-preview.png');
                const blob = await response.blob();
                const file = new File([blob], 'arjuna-ai.png', { type: 'image/png' });

                const shareData: ShareData = {
                    title: "Arjuna AI - Ace Your Tech Interviews",
                    text: shareMessage,
                    url: referralLink,
                };

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }

                await navigator.share(shareData);
            } catch (error) {
                console.error("Error sharing:", error);
                // Fallback to basic share if file sharing fails
                try {
                    await navigator.share({
                        title: "Arjuna AI - Ace Your Tech Interviews",
                        text: shareMessage,
                        url: referralLink,
                    });
                } catch (innerError) {
                    console.error("Fallback share failed:", innerError);
                }
            }
        } else {
            handleCopyLink();
        }
        setSharing(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl">
                <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent z-10" />
                    <Image
                        src="/social-share.png"
                        alt="Referral"
                        fill
                        className="object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="h-16 w-16 bg-background/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                            <Share2 className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-30 h-8 w-8 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center hover:bg-background/80 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5 sm:p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <DialogTitle className="text-2xl font-bold tracking-tight">Refer & Earn</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            Invite your friends to Arjuna AI and help them ace their next big interview!
                        </DialogDescription>
                    </div>

                    <div className="bg-muted/50 border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-4 group transition-colors hover:border-primary/30">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Referral Link</p>
                            <p className="text-sm font-medium break-all text-foreground leading-relaxed">{referralLink}</p>
                        </div>
                        <Button
                            size="sm"
                            variant={copied ? "default" : "outline"}
                            className={cn(
                                "h-10 px-4 rounded-xl transition-all duration-300",
                                "hover:bg-primary/5 hover:text-primary hover:border-primary/30",
                                copied && "bg-emerald-500 hover:bg-emerald-600 border-none text-white hover:text-white"
                            )}
                            onClick={handleCopyLink}
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <button
                            onClick={shareOnWhatsApp}
                            disabled={sharing === 'whatsapp'}
                            className="flex flex-col items-center gap-2 group disabled:opacity-50"
                        >
                            <div className={cn(
                                "h-12 w-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20 transition-all group-hover:scale-110 group-hover:bg-[#25D366]/20",
                                sharing === 'whatsapp' && "animate-pulse"
                            )}>
                                <MessageCircle className="h-6 w-6 text-[#25D366]" />
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                {sharing === 'whatsapp' ? 'Loading...' : 'WhatsApp'}
                            </span>
                        </button>

                        <button
                            onClick={shareOnTelegram}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center border border-[#0088cc]/20 transition-all group-hover:scale-110 group-hover:bg-[#0088cc]/20">
                                <Send className="h-6 w-6 text-[#0088cc]" />
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">Telegram</span>
                        </button>

                        <button
                            onClick={shareOnTwitter}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-foreground/10 transition-all group-hover:scale-110 group-hover:bg-foreground/10">
                                <Twitter className="h-6 w-6 text-foreground" />
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">Twitter</span>
                        </button>

                        <button
                            onClick={shareOnLinkedIn}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-[#0077b5]/10 flex items-center justify-center border border-[#0077b5]/20 transition-all group-hover:scale-110 group-hover:bg-[#0077b5]/20">
                                <Linkedin className="h-6 w-6 text-[#0077b5]" />
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">LinkedIn</span>
                        </button>
                    </div>

                    {typeof navigator !== "undefined" && !!navigator.share && (
                        <Button
                            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                            onClick={handleNativeShare}
                            disabled={sharing === 'native'}
                        >
                            <Share2 className={cn("mr-2 h-4 w-4", sharing === 'native' && "animate-spin")} />
                            {sharing === 'native' ? 'Preparing...' : 'More Options'}
                        </Button>
                    )}

                    <div className="pt-2 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground italic">
                            * Reward system coming soon! Share now to build your network.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReferralModal;
