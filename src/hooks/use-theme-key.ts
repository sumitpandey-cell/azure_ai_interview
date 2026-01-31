"use client";

import { useState, useEffect } from "react";

/**
 * A hook that returns a key that changes whenever the theme (dark/light) changes.
 * This is useful for forcing re-renders of components that don't automatically
 * respond to CSS variable changes (like Recharts).
 */
export function useThemeKey() {
    const [themeKey, setThemeKey] = useState(0);

    useEffect(() => {
        // Function to update the key
        const updateKey = () => setThemeKey(prev => prev + 1);

        // Initial check and setup of MutationObserver to watch for class changes on <html>
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' || mutation.attributeName === 'data-color-theme') {
                    updateKey();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-color-theme']
        });

        return () => observer.disconnect();
    }, []);

    return `theme-${themeKey}`;
}
