"use client";

import { useEffect } from "react";

export default function ScrollAnimator() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-animate]")
    );

    if (els.length === 0) return;

    const viewportH = window.innerHeight;

    // Only hide elements that start below the fold — never hide above-the-fold content
    els.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top > viewportH * 0.85) {
        el.classList.add("anim-pending");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            if (el.classList.contains("anim-pending")) {
              const delay = el.dataset.delay ?? "0";
              el.style.transitionDelay = `${delay}ms`;
              el.classList.remove("anim-pending");
              el.classList.add("anim-in");
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
