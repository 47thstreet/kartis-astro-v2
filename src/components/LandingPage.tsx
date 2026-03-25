"use client";

import { useEffect } from "react";
import { CursorGlow } from "./CursorGlow";

/**
 * Interactive enhancement layer for the landing page.
 * The static HTML is rendered by Astro (SSR). This component adds:
 * - Cursor glow effect
 * - Scroll-triggered fade-in animations via Intersection Observer
 * No content is rendered here — it's all progressive enhancement.
 */
export default function LandingPage({ locale }: { locale: string }) {
  useEffect(() => {
    // Add fade-in animation to sections as they scroll into view
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return <CursorGlow />;
}
