"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      el.style.opacity = "1";
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };

    const hide = () => { el.style.opacity = "0"; };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", hide);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-[1] top-0 left-0 w-[280px] h-[280px] rounded-full opacity-0 transition-opacity duration-300"
      style={{
        background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
