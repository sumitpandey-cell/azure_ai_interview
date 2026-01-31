'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again
        setDeferredPrompt(null);
    };

    if (isInstalled || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-background/80 backdrop-blur-md border border-primary/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Download className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">Install ArjunaAi</p>
                    <p className="text-xs text-muted-foreground">Add to home screen for a better experience</p>
                </div>
                <Button size="sm" onClick={handleInstallClick} className="rounded-xl px-4">
                    Install
                </Button>
                <button
                    onClick={() => setDeferredPrompt(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span className="sr-only">Close</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
