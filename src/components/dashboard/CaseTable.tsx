"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SlideCase, CaseStatus } from "@/types/case";

interface Props {
  cases: SlideCase[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelect: (c: SlideCase) => void;
  selectedId?: string;
  isLoading?: boolean;
  sortBy?: string;
  sortDir?: string;
  onSort?: (key: string) => void;
}

const STATUS: Record<CaseStatus, { label: string; dot: string; badge: string }> = {
  DONE: {
    label: "완료",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
  },
  PROCESSING: {
    label: "분석중",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800",
  },
  WAITING: {
    label: "대기",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600",
  },
  ERROR: {
    label: "오류",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800",
  },
  CONFIRMED: {
    label: "확인됨",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-800",
  },
};

export function CaseTable({ cases, total, page, pageSize, onPageChange, onSelect, selectedId, isLoading, sortBy, sortDir, onSort }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  function visiblePages(): number[] {
    const windowSize = 5;
    const cur = page - 1;
    let start = Math.max(0, cur - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize);
    if (end - start < windowSize) start = Math.max(0, end - windowSize);
    const pages: number[] = [];
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  }

  function StatusBadge({ status }: { status: CaseStatus }) {
    const s = STATUS[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  }

  function ProgressBar({ caseId }: { caseId: string }) {
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState("");

    useEffect(() => {
      let active = true;
      let intervalId: ReturnType<typeof setInterval>;
      const poll = async () => {
        try {
          const res = await fetch(`/api/analysis/${caseId}/progress`);
          if (res.ok && active) {
            const data = await res.json();
            setProgress(data.progress ?? 0);
            setStep(data.step ?? "");
            if (data.status !== "PROCESSING") {
              clearInterval(intervalId);
            }
          }
        } catch {}
      };
      poll();
      intervalId = setInterval(poll, 3000);
      return () => { active = false; clearInterval(intervalId); };
    }, [caseId]);

    return (
      <div className="mt-0.5 w-full">
        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[8px] text-gray-400 tabular-nums leading-tight truncate block">
          {step || `${Math.round(progress)}%`}
        </span>
      </div>
    );
  }

  const IHC_STAINS = ["HER2", "ER", "PR", "KI67"];

  function stainMatches(classification: string | undefined, caseStain: string): boolean {
    if (!classification || classification === "uncertain") return false;
    if (classification === "HE") return caseStain === "HE";
    if (classification.startsWith("IHC")) return IHC_STAINS.includes(caseStain);
    return classification === caseStain;
  }

  function AiLabel({ value, match }: { value: string; match: boolean }) {
    return (
      <span className={`text-[12px] font-semibold ${
        match ? "text-gray-900" : "text-red-600"
      }`}>
        {value}
      </span>
    );
  }

  function OrganMatchCell({ c }: { c: SlideCase }) {
    if (!c.qcResult) return <span className="text-gray-400">-</span>;
    return <AiLabel value={c.qcResult.detectedOrgan} match={c.qcResult.organMatch} />;
  }

  function LesionCell({ c }: { c: SlideCase }) {
    if (!c.qcResult) return <span className="text-gray-400">-</span>;
    if (!c.qcResult.lesionVolume)
      return <span className="text-[11px] text-gray-400 italic">N/A</span>;
    const isLow = c.qcResult.lesionVolume === "Low";
    return (
      <span className={`text-[12px] font-semibold ${isLow ? "text-red-600" : "text-gray-900"}`}>
        {c.qcResult.lesionVolume}
      </span>
    );
  }

  function QcCell({ c }: { c: SlideCase }) {
    if (!c.qcResult) return <span className="text-gray-400">-</span>;
    const score = c.qcResult.overallQcScore;
    const isLow = score < 60;
    return (
      <span className={`inline-flex items-center justify-center w-9 h-7 rounded-lg border-2 text-xs font-extrabold ${
        isLow ? "border-red-500 text-red-600" : "border-gray-300 text-gray-900"
      }`}>
        {score}
      </span>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 rounded-xl shadow-sm border min-h-0 overflow-auto bg-[#f6f8fb]">
        <table className="w-full caption-bottom text-sm table-fixed">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-[#1a3a5c] hover:bg-[#1a3a5c]">
                {[
                  { key: "no", label: "No.", sort: false, w: "w-[45px]" },
                  { key: "slideId", label: "검체번호", sort: true, w: "min-w-[150px]", align: "text-left" },
                  { key: "date", label: "업로드 일자", sort: true, w: "w-[110px]" },
                  { key: "status", label: "상태", sort: false, w: "w-[90px]" },
                  { key: "patient", label: "환자 / 차트번호", sort: true, w: "w-[130px]" },
                  { key: "pathologist", label: "판독의", sort: false, w: "w-[90px]" },
                  { key: "organ", label: "장기", sort: true, w: "w-[80px]" },
                  { key: "organMatch", label: "AI 장기", sort: false, w: "w-[75px]" },
                  { key: "stain", label: "염색", sort: true, w: "w-[60px]" },
                  { key: "stainMatch", label: "AI 염색", sort: false, w: "w-[75px]" },
                  { key: "control", label: "컨트롤 티슈", sort: false, w: "w-[85px]" },
                  { key: "lesion", label: "병변량", sort: false, w: "w-[75px]" },
                  { key: "qc", label: "품질", sort: true, w: "w-[70px]" },
                  { key: "qcSummary", label: "QC 종합", sort: false, w: "w-[80px]" },
                ].map((col) => (
                  <TableHead
                    key={col.key}
                    className={`text-[11px] font-bold text-white/90 uppercase tracking-wider whitespace-nowrap py-2.5 bg-[#1a3a5c] ${col.w} ${"align" in col ? col.align : ""} ${
                      col.sort ? "cursor-pointer select-none hover:text-white" : ""
                    }`}
                    onClick={col.sort && onSort ? () => onSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sort && (
                        sortBy === col.key
                          ? sortDir === "asc"
                            ? <ArrowUp className="w-3 h-3 text-white" />
                            : <ArrowDown className="w-3 h-3 text-white" />
                          : <ArrowUpDown className="w-3 h-3 text-white/30" />
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c, i) => (
                <TableRow
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`cursor-pointer h-11 ${
                    selectedId === c.id
                      ? "bg-blue-50 border-l-2 border-l-blue-500"
                      : i % 2 === 0
                      ? "bg-white hover:bg-gray-50"
                      : "bg-[#fafbfc] hover:bg-gray-50"
                  }`}
                >
                  <TableCell className="py-1.5 text-[11px] text-gray-400 tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="py-1.5 text-left">
                    <span className="font-mono text-[12px] font-semibold text-[#1a3a5c] line-clamp-2 break-all">
                      {c.specimenNo || c.slideId}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap text-[11px] text-gray-500">
                    {c.createdAt ? c.createdAt.split("T")[0] : ""}
                  </TableCell>
                  <TableCell className="py-1 whitespace-nowrap">
                    <StatusBadge status={c.status} />
                    {c.status === "PROCESSING" && <ProgressBar caseId={c.id} />}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="text-[12px] font-bold text-gray-900 leading-tight">{c.patientName}</div>
                    <div className="text-[10px] text-gray-500 font-mono leading-tight">{c.patientId}</div>
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    <span className="text-[12px] text-gray-700">{c.pathologist || "-"}</span>
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    <span className="text-[13px] font-semibold text-gray-800">{c.organ}</span>
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    <OrganMatchCell c={c} />
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e8edf5] text-[#1a3a5c] text-[11px] font-bold">
                      {c.stainType}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    {c.qcResult ? (
                      <AiLabel value={c.qcResult.stainClassification} match={stainMatches(c.qcResult.stainClassification, c.stainType)} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    {c.qcResult ? (
                      c.qcResult.controlTissuePresent === null ? (
                        <span className="text-[11px] text-gray-400 italic">N/A</span>
                      ) : c.qcResult.controlTissuePresent ? (
                        <span className="text-[12px] font-semibold text-gray-900">발현</span>
                      ) : (
                        <span className="text-[12px] font-semibold text-red-600">미발현</span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    <LesionCell c={c} />
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    <QcCell c={c} />
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    {!c.qcResult ? (
                      <span className="text-gray-400">-</span>
                    ) : c.qcResult.organMatch && stainMatches(c.qcResult.stainClassification, c.stainType) && c.qcResult.overallQcScore > 0 ? (
                      <span className="text-emerald-600 font-bold text-[12px]">적합</span>
                    ) : (
                      <span className="text-red-600 font-bold text-[12px]">부적합</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </table>
      </div>

      {/* Pagination — 하단 고정 */}
      <div className="shrink-0 flex items-center justify-between px-2 py-1">
        <span className="text-[13px] text-gray-500">
          전체 <strong className="text-gray-800">{total}</strong>건
          {isLoading && <span className="ml-2 text-xs text-blue-500">로딩중...</span>}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
              <path fillRule="evenodd" d="M12.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L8.832 10l3.938 3.71a.75.75 0 01.02 1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {visiblePages().map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p + 1)}
              className={`w-8 h-8 rounded-lg text-[13px] font-semibold tabular-nums cursor-pointer transition-all ${
                page - 1 === p
                  ? "bg-[#1a3a5c] text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p + 1}
            </button>
          ))}

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.21 14.77a.75.75 0 01.02-1.06L8.168 10 4.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02zm6 0a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
