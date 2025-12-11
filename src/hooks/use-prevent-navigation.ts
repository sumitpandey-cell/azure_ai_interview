import { useEffect } from 'react';

interface UsePreventNavigationOptions {
    message?: string;
    onNavigateAway?: () => void | Promise<void>;
    enabled?: boolean;
}

/**
 * Hook to prevent backward navigation (back button) and show confirmation dialog
 * Use this on pages where users shouldn't be able to go back (e.g., live interview, setup)
 * Note: This does NOT prevent programmatic navigation (router.push/replace)
 */
export function usePreventNavigation(options: UsePreventNavigationOptions = {}) {
    const {
        message = "Are you sure you want to leave? Your progress may be lost.",
        onNavigateAway,
        enabled = true
    } = options;

    useEffect(() => {
        if (!enabled) return;

        // Push a state to prevent going back
        window.history.pushState(null, '', window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // Push state again to prevent going back
            window.history.pushState(null, '', window.location.href);

            // Show confirmation dialog
            const confirmExit = window.confirm(message);

            if (confirmExit && onNavigateAway) {
                onNavigateAway();
            }
        };

        // Only listen to popstate (back button), not all navigation
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [enabled, message, onNavigateAway]);
}
