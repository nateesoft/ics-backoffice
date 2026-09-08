"use client";

import { useState, useEffect } from "react";

type Theme = {
  gradient: string;
  line2: string;
  effect: string; // CSS animation class for accent text
};

const THEMES: Theme[] = [
  {
    // Gold shimmer
    gradient: "linear-gradient(90deg,#fde68a,#fbbf24,#ffffff,#bfdbfe,#fde68a)",
    line2: "text-white/65",
    effect: "anim-text-shimmer",
  },
  {
    // Cyan shimmer
    gradient: "linear-gradient(90deg,#a5f3fc,#67e8f9,#ffffff,#e0f2fe,#a5f3fc)",
    line2: "text-cyan-200/80",
    effect: "anim-text-shimmer",
  },
  {
    // Rose pulse
    gradient: "linear-gradient(90deg,#fda4af,#fb7185,#ffffff,#fda4af)",
    line2: "text-rose-200/75",
    effect: "anim-text-pulse",
  },
  {
    // Emerald shimmer
    gradient: "linear-gradient(90deg,#6ee7b7,#34d399,#ffffff,#d1fae5,#6ee7b7)",
    line2: "text-emerald-200/80",
    effect: "anim-text-shimmer",
  },
  {
    // Purple pulse
    gradient: "linear-gradient(90deg,#c4b5fd,#a78bfa,#ffffff,#ede9fe,#c4b5fd)",
    line2: "text-purple-200/75",
    effect: "anim-text-pulse",
  },
  {
    // Orange shimmer
    gradient: "linear-gradient(90deg,#fed7aa,#fb923c,#ffffff,#ffedd5,#fed7aa)",
    line2: "text-orange-200/75",
    effect: "anim-text-shimmer",
  },
  {
    // Rainbow fast shimmer
    gradient:
      "linear-gradient(90deg,#fde68a,#86efac,#67e8f9,#c4b5fd,#fda4af,#fde68a)",
    line2: "text-white/65",
    effect: "anim-text-shimmer-fast",
  },
];

const INTERVAL_MS = 10_000;

function randomOther(current: number, max: number) {
  let next: number;
  do {
    next = Math.floor(Math.random() * max);
  } while (next === current);
  return next;
}

export default function HeroHeading() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      setShow(false);
      setTimeout(() => {
        setIdx((prev) => randomOther(prev, THEMES.length));
        setShow(true);
      }, 450);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const theme = THEMES[idx];

  return (
    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight mb-6">
      {/* Line 1 — static white, slides in on load */}
      <span className="block text-white anim-hero-1">เทคโนโลยี</span>

      {/* Line 2 — color changes with theme */}
      <span
        className={`block anim-hero-2 transition-all duration-700 ${theme.line2}`}
      >
        ที่ขับเคลื่อน
      </span>

      {/* Line 3 — gradient accent with random animation */}
      <span className="block anim-hero-3">
        <span
          className={`bg-clip-text text-transparent ${theme.effect} transition-opacity duration-[450ms] ${
            show ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: theme.gradient,
            backgroundSize: "250% auto",
          }}
        >
          ธุรกิจคุณ
        </span>
      </span>
    </h1>
  );
}
