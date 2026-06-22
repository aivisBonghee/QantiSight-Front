"use client";

import { useEffect, useState } from "react";
import type { DashboardSummary } from "@/types/case";

interface Props {
  summary: DashboardSummary;
  compact?: boolean;
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW((value / max) * 100), 100);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
      <div className="h-full rounded-full bg-white transition-all duration-1000 ease-out" style={{ width: `${w}%` }} />
    </div>
  );
}

export function SummaryCards({ summary, compact = false }: Props) {
  const organRate = useCountUp(summary.organMatchRate);
  const stainAcc = useCountUp(summary.stainAccuracy);
  const controlRate = useCountUp(summary.controlTissueRate);
  const lesionRatio = useCountUp(summary.avgLesionRatio * 100);
  const qcScore = useCountUp(summary.avgQcScore);

  const cards = [
    {
      label: "장기 일치 검증",
      value: `${organRate.toFixed(1)}%`,
      sub: <>불일치 <strong>{summary.organMismatchCount}</strong>건</>,
      gradient: "from-[#1a3a5c] to-[#2a5a8c]",
      bar: summary.organMatchRate,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-full h-full">
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" />
        </svg>
      ),
    },
    {
      label: "염색 종류 분류",
      value: `${stainAcc.toFixed(1)}%`,
      sub: "분류 정확도",
      gradient: "from-emerald-600 to-emerald-500",
      bar: summary.stainAccuracy,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-full h-full">
          <path d="M12 2v6m0 0a4 4 0 100 8 4 4 0 000-8z" strokeLinecap="round" />
          <path d="M8 14s-2 2-2 4a4 4 0 008 0c0-2-2-4-2-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "컨트롤 티슈",
      value: `${controlRate.toFixed(1)}%`,
      sub: <>미검출 <strong>{summary.controlTissueMissingCount}</strong>건</>,
      gradient: "from-purple-600 to-violet-500",
      bar: summary.controlTissueRate,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-full h-full">
          <circle cx="12" cy="12" r="3" /><path d="M12 1v4m0 14v4m-9.5-13.5l3 1.5m13-1.5l-3 1.5M2.5 17.5l3-1.5m13 1.5l-3-1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "병변량 추정",
      value: `${lesionRatio.toFixed(1)}%`,
      sub: (
        <span className="flex gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-white/20 font-bold text-[10px]">L {summary.lesionDistribution.low}</span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 font-bold text-[10px]">M {summary.lesionDistribution.moderate}</span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 font-bold text-[10px]">H {summary.lesionDistribution.high}</span>
        </span>
      ),
      gradient: "from-amber-500 to-orange-400",
      bar: null,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-full h-full">
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 17l4-8 4 4 5-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "품질 평가",
      value: <><span>{qcScore.toFixed(0)}</span><span className="text-sm text-white/80 font-semibold ml-1">/ 100</span></>,
      sub: <>Focus 이슈 <strong>{summary.focusIssueCount}</strong>건</>,
      gradient: "from-[#355C94] to-[#5578AF]",
      bar: summary.avgQcScore,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z" />
        </svg>
      ),
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-5 gap-2 transition-all duration-300">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-lg bg-gradient-to-br ${c.gradient} px-3 py-1.5 text-white shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">
                {c.label}
              </span>
              <span className="text-base font-extrabold ml-2 shrink-0">{c.value}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`rounded-xl bg-gradient-to-br ${c.gradient} p-3.5 text-white shadow-md animate-in fade-in slide-in-from-bottom-3 duration-500`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-white leading-tight">
              {c.label}
            </span>
            <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white p-1.5 shrink-0">
              {c.icon}
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{c.value}</div>
          {c.bar !== null && <MiniBar value={c.bar} />}
          <div className="mt-1.5 text-[11px] text-white/80">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
