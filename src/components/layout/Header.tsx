"use client";

import { UploadIndicator } from "@/components/layout/UploadIndicator";

interface Props {
  onToggleFilter?: () => void;
}

export function Header({ onToggleFilter }: Props) {
  return (
    <header className="h-12 bg-[#1a3a5c] flex items-center justify-between px-3 md:px-5 shrink-0 relative">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile filter toggle */}
        <button
          onClick={onToggleFilter}
          className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 cursor-pointer"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
        </button>

        <img src="/aivis-logo-white.svg" alt="AIVIS" className="h-5 hidden sm:block" />
        <div className="w-px h-5 bg-white/20 hidden sm:block" />
        <span className="text-white text-sm font-semibold tracking-tight">QantiSight</span>
        <span className="text-white/40 text-[10px] hidden md:inline">Slide Preview QC</span>
      </div>
      <div className="flex items-center gap-2">
        <UploadIndicator />
        <a
          href="/upload"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          업로드
        </a>
      </div>
    </header>
  );
}
