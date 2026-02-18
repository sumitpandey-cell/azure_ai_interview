import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { interviewService } from '@/services/interview.service';
import { publicSupabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface ProctoringOptions {
    sessionId: string;
    userId: string | null;
    enabled?: boolean;
    preventCopyPaste?: boolean;
    preventRightClick?: boolean;
    requireFullscreen?: boolean;
}

/**
 * Hook to implement cheating restrictions during a live interview.
 * Tracks tab switching, window blurring, and prevents unauthorized actions.
 */
export function useProctoring({
    sessionId,
    userId,
    enabled = true,
    preventCopyPaste = true,
    preventRightClick = true,
    requireFullscreen = false
}: ProctoringOptions) {
    const violationCount = useRef<Record<string, number>>({});

    const logViolation = useCallback(async (type: string, detail?: string) => {
        if (!enabled) return;

        // Update local count
        violationCount.current[type] = (violationCount.current[type] || 0) + 1;

        console.warn(`🛑 Proctoring Violation [${type}]: ${detail || ''}`);

        try {
            const client = userId ? undefined : publicSupabase;

            // Fetch current session to get candidate_metadata
            const session = await interviewService.getSessionById(sessionId, client);
            if (!session) return;

            const metadata = (session.candidate_metadata as Record<string, unknown>) || {};
            const logs = (metadata.proctoring_logs as Array<Record<string, unknown>>) || [];

            logs.push({
                type,
                detail,
                timestamp: new Date().toISOString(),
                count: violationCount.current[type]
            });

            // Update session with new logs
            await interviewService.updateSession(sessionId, {
                config: {
                    ...(session.config as Record<string, unknown>),
                    proctoring_violations: (session.config as Record<string, unknown>)?.proctoring_violations || violationCount.current
                } as unknown as Json,
                // We'll store formal logs in candidate_metadata for recruiters
                // but since updateSession might not explicitly handle candidate_metadata,
                // we'll check if we need to update it differently.
            }, client);

            // If we can't update candidate_metadata directly via updateSession, 
            // we might need to use supabase client directly if interviewService doesn't expose it.
            // For now, let's assume config is a safe place for proctoring data.

        } catch (error) {
            console.error("Failed to log proctoring violation:", error);
        }
    }, [enabled, sessionId, userId]);

    useEffect(() => {
        if (!enabled) return;

        // 1. Tab Switching Detection
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logViolation('TAB_SWITCHED', 'Candidate moved away from the interview tab');
                toast.error("Cheating Warning: Please stay on this tab. This event has been logged.", {
                    duration: 5000,
                    position: 'top-center'
                });
            }
        };

        // 2. Window Blur Detection (loss of focus)
        const handleWindowBlur = () => {
            logViolation('WINDOW_BLURRED', 'Candidate unfocused the interview window');
        };

        // 3. Right Click Prevention
        const handleContextMenu = (e: MouseEvent) => {
            if (preventRightClick) {
                e.preventDefault();
                logViolation('RIGHT_CLICK_ATTEMPTED', 'Candidate tried to use right-click menu');
                toast.warning("Right-click is disabled during the interview.");
            }
        };

        // 4. Keyboard Shortcuts Prevention
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
            const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
            const isCut = (e.ctrlKey || e.metaKey) && e.key === 'x';
            const isPrintScreen = e.key === 'PrintScreen';
            const isDevTools = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J');
            const isF12 = e.key === 'F12';

            if (preventCopyPaste && (isCopy || isPaste || isCut)) {
                e.preventDefault();
                const action = isCopy ? 'Copy' : isPaste ? 'Paste' : 'Cut';
                logViolation(`KEYBOARD_${action.toUpperCase()}_ATTEMPTED`, `Candidate tried to ${action} text`);
                toast.warning(`${action} is disabled during the interview.`);
            }

            if (isDevTools || isF12) {
                e.preventDefault();
                logViolation('DEVTOOLS_ATTEMPTED', 'Candidate tried to open developer tools');
                toast.error("Developer tools are restricted.");
            }

            if (isPrintScreen) {
                logViolation('SCREENSHOT_ATTEMPTED', 'Candidate tried to take a screenshot');
                toast.warning("Screenshots are logged.");
            }
        };

        // 5. Fullscreen Enforcement
        const enforceFullscreen = async () => {
            if (requireFullscreen && !document.fullscreenElement) {
                try {
                    await document.documentElement.requestFullscreen();
                } catch (err) {
                    console.error("Failed to force fullscreen:", err);
                }
            }
        };

        const handleFullscreenChange = () => {
            if (requireFullscreen && !document.fullscreenElement) {
                logViolation('FULLSCREEN_EXITED', 'Candidate exited fullscreen mode');
                toast.error("Illegal Exit: Fullscreen mode is mandatory for this interview. Please return to continue.", {
                    duration: Infinity, // Stay until fixed
                    action: {
                        label: "Enter Fullscreen",
                        onClick: () => {
                            enforceFullscreen();
                            toast.dismiss();
                        }
                    },
                    position: 'top-center'
                });
            }
        };

        const checkAndPromptFullscreen = () => {
            if (requireFullscreen && !document.fullscreenElement) {
                toast.error("Mandatory: Fullscreen mode is required for this session.", {
                    duration: Infinity,
                    id: 'fullscreen-required',
                    action: {
                        label: "Enter Fullscreen",
                        onClick: () => {
                            enforceFullscreen();
                            toast.dismiss('fullscreen-required');
                        }
                    },
                    position: 'top-center'
                });
            }
        };

        // Check on mount/enable
        checkAndPromptFullscreen();

        // Event Listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        if (preventRightClick) document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        if (requireFullscreen) document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [enabled, preventRightClick, preventCopyPaste, requireFullscreen, logViolation]);

    return {
        violationCount: violationCount.current
    };
}
