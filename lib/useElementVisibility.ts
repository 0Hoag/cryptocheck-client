"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lets visual-only work pause when its element has scrolled out of view.
 * The optimistic initial value prevents a hydration flash in older browsers.
 */
export function useElementVisibility<T extends Element>() {
    const ref = useRef<T | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const element = ref.current;
        if (!element || typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}
