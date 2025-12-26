"use client";

import { motion } from "framer-motion";
import React from "react";

export function SlideShell({
  children,
  bg,
}: {
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div className="relative w-full max-w-5xl">
      {/* Background layer */}
      <div
        className={[
          "absolute inset-0 rounded-[32px] overflow-hidden",
          "border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_80px_rgba(0,0,0,0.6)]",
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-black" />
        <div
          className={[
            "absolute inset-0 opacity-90",
            bg ?? "bg-gradient-to-br from-fuchsia-500/30 via-blue-500/20 to-emerald-500/20",
          ].join(" ")}
        />
        {/* Subtle grain */}
        <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_90%_30%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_40%_90%,rgba(255,255,255,0.15),transparent_35%)]" />
      </div>

      {/* Foreground content */}
      <motion.div
        className="relative rounded-[32px] p-10 md:p-14"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
