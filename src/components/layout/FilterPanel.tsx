"use client";

import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilters } from "@/hooks/useFilters";
import { PanelLeftClose } from "lucide-react";
import type { StainCategory, OrganType, CaseStatus, QcGrade } from "@/types/case";

const STAINS: { value: StainCategory; label: string; color: string }[] = [
  { value: "HE", label: "H&E", color: "bg-violet-400" },
  { value: "IHC-membrane", label: "IHC-membrane", color: "bg-sky-400" },
  { value: "IHC-nuclear", label: "IHC-nuclear", color: "bg-rose-400" },
];

const ORGANS: { value: OrganType; label: string }[] = [
  { value: "Breast", label: "Breast" },
  { value: "Stomach", label: "Stomach" },
  { value: "Bladder", label: "Bladder" },
  { value: "Thyroid", label: "Thyroid" },
  { value: "Colon", label: "Colon" },
  { value: "Brain", label: "Brain" },
];

const STATUSES: { value: CaseStatus; label: string; color: string }[] = [
  { value: "DONE", label: "분석완료", color: "bg-emerald-500" },
  { value: "PROCESSING", label: "분석중", color: "bg-blue-500" },
  { value: "WAITING", label: "대기", color: "bg-gray-400" },
  { value: "ERROR", label: "오류", color: "bg-red-500" },
];

interface Props {
  totalCount: number;
  onClose?: () => void;
  onCollapse?: () => void;
}

function ToggleChip({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all border ${
        active ? `${color ?? "bg-[#1a3a5c]"} text-white border-transparent shadow-sm` : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      }`}>
      {label}
    </button>
  );
}

function CollapsibleSection({
  title, defaultOpen = true, children, count,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="px-4 py-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold group-hover:text-gray-600 transition-colors">
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#1a3a5c] text-white text-[9px] font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        <svg
          viewBox="0 0 20 20" fill="currentColor"
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function FilterPanel({ totalCount, onClose, onCollapse }: Props) {
  const [doctorInput, setDoctorInput] = useState("");
  const [doctors, setDoctors] = useState<string[]>([]);
  const composingRef = useRef(false);

  const {
    stainTypes, organs, statuses,
    organMatch, stainMatch, controlTissue, qcGrade, qcThresholds, hasIssue, pathologist,
    toggleStain, toggleOrgan, toggleStatus,
    setOrganMatch, setStainMatch, setControlTissue, setQcGrade, setQcThresholds, toggleHasIssue,
    setPathologist,
    reset,
  } = useFilters();

  function addDoctor() {
    const trimmed = doctorInput.trim();
    if (trimmed && !doctors.includes(trimmed)) {
      setDoctors((prev) => [...prev, trimmed]);
    }
    setDoctorInput("");
  }

  function removeDoctor(d: string) {
    setDoctors((prev) => prev.filter((x) => x !== d));
    if (pathologist === d) setPathologist(null);
  }

  const hasFilters =
    stainTypes.length > 0 || organs.length > 0 || statuses.length > 0 ||
    organMatch !== null || stainMatch !== null || controlTissue !== null || qcGrade !== null || hasIssue || pathologist !== null;

  const qcFilterCount = [organMatch, stainMatch, controlTissue, qcGrade].filter(Boolean).length;

  return (
    <aside className="w-48 bg-white border-r flex flex-col shrink-0 text-[13px] h-full overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b">
        <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-widest">필터</span>
        <div className="flex items-center gap-1.5">
          {hasFilters && (
            <button onClick={reset} className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer">초기화</button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-gray-100 hover:bg-[#1a3a5c] items-center justify-center text-gray-500 hover:text-white cursor-pointer transition-all"
              title="필터 접기"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="lg:hidden w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-[#f0f4f8] border-b">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">검색 결과</div>
          <div className="text-xl font-bold text-[#1a3a5c] mt-0.5">{totalCount}</div>
        </div>

        <div className="px-4 py-2.5">
          <button
            onClick={toggleHasIssue}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              hasIssue
                ? "bg-red-500 text-white border-red-500 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${hasIssue ? "bg-white" : "bg-red-400"}`} />
            부적합
          </button>
        </div>

        <div className="border-t" />

        <CollapsibleSection title="QC 필터" count={qcFilterCount}>
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-[9px] text-gray-400 mb-1">장기 일치</div>
              <div className="flex flex-wrap gap-1.5">
                <ToggleChip label="일치" active={organMatch === "match"} color="bg-emerald-600" onClick={() => setOrganMatch("match")} />
                <ToggleChip label="불일치" active={organMatch === "mismatch"} color="bg-red-500" onClick={() => setOrganMatch("mismatch")} />
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-1">염색 일치</div>
              <div className="flex flex-wrap gap-1.5">
                <ToggleChip label="일치" active={stainMatch === "match"} color="bg-emerald-600" onClick={() => setStainMatch("match")} />
                <ToggleChip label="불일치" active={stainMatch === "mismatch"} color="bg-red-500" onClick={() => setStainMatch("mismatch")} />
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-1">컨트롤 티슈</div>
              <div className="flex flex-wrap gap-1.5">
                <ToggleChip label="검출" active={controlTissue === "present"} color="bg-purple-600" onClick={() => setControlTissue("present")} />
                <ToggleChip label="미검출" active={controlTissue === "missing"} color="bg-red-500" onClick={() => setControlTissue("missing")} />
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-1">품질 기준</div>
              <div className="flex flex-col gap-1">
                {([
                  { key: "pass" as const, label: "Pass", color: "#1a3a5c" },
                  { key: "conditional" as const, label: "주의", color: "#F59E0B" },
                  { key: "rescan" as const, label: "재스캔", color: "#FF8C00" },
                ] as const).map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-gray-600 w-10 shrink-0">{label}</span>
                    <span className="text-[9px] text-gray-400 shrink-0">≥</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={qcThresholds[key]}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v)) {
                          setQcThresholds({ ...qcThresholds, [key]: v });
                        }
                      }}
                      onBlur={() => {
                        const clamped = Math.max(0, Math.min(100, qcThresholds[key]));
                        if (clamped !== qcThresholds[key]) {
                          setQcThresholds({ ...qcThresholds, [key]: clamped });
                        }
                      }}
                      className="w-10 text-[10px] text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#355C94]"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <ToggleChip label={`Pass ${qcThresholds.pass}+`} active={qcGrade === "pass"} color="bg-[#1a3a5c]" onClick={() => setQcGrade("pass" as QcGrade)} />
                <ToggleChip label={`${qcThresholds.conditional}-${qcThresholds.pass - 1}`} active={qcGrade === "conditional"} color="bg-amber-500" onClick={() => setQcGrade("conditional" as QcGrade)} />
                <ToggleChip label={`${qcThresholds.rescan}-${qcThresholds.conditional - 1}`} active={qcGrade === "rescan"} color="bg-orange-500" onClick={() => setQcGrade("rescan" as QcGrade)} />
                <ToggleChip label={`<${qcThresholds.rescan}`} active={qcGrade === "fail"} color="bg-red-500" onClick={() => setQcGrade("fail" as QcGrade)} />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <div className="border-t" />

        <CollapsibleSection title="염색 분류" count={stainTypes.length}>
          <div className="flex flex-col gap-0.5">
            {STAINS.map((s) => (
              <label key={s.value} className={`flex items-center py-1 px-1.5 rounded cursor-pointer transition-colors ${stainTypes.includes(s.value) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <Checkbox checked={stainTypes.includes(s.value)} onCheckedChange={() => toggleStain(s.value)} className="h-3 w-3" />
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-gray-700">{s.label}</span>
                </div>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        <div className="border-t" />

        <CollapsibleSection title="장기" count={organs.length}>
          <div className="flex flex-col gap-0.5">
            {ORGANS.map((o) => (
              <label key={o.value} className={`flex items-center py-1 px-1.5 rounded cursor-pointer transition-colors ${organs.includes(o.value) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <Checkbox checked={organs.includes(o.value)} onCheckedChange={() => toggleOrgan(o.value)} className="h-3 w-3" />
                  <span className="text-gray-700">{o.label}</span>
                </div>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        <div className="border-t" />

        <CollapsibleSection title="상태" count={statuses.length}>
          <div className="flex flex-col gap-0.5">
            {STATUSES.map((s) => (
              <label key={s.value} className={`flex items-center py-1 px-1.5 rounded cursor-pointer transition-colors ${statuses.includes(s.value) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <Checkbox checked={statuses.includes(s.value)} onCheckedChange={() => toggleStatus(s.value)} className="h-3 w-3" />
                  <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                  <span className="text-gray-700">{s.label}</span>
                </div>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        <div className="border-t" />

        <CollapsibleSection title="판독의" count={pathologist !== null ? 1 : 0}>
          <div className="flex gap-1 items-center">
            <input
              value={doctorInput}
              onChange={(e) => setDoctorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !composingRef.current) addDoctor(); }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              placeholder="의사명"
              className="min-w-0 flex-1 text-[11px] border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#355C94] focus:border-[#355C94]"
            />
            <button onClick={addDoctor} className="shrink-0 text-[10px] px-2 py-1 min-w-[28px] rounded bg-[#1a3a5c] text-white hover:bg-[#355C94] cursor-pointer">+</button>
          </div>
          {doctors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {doctors.map((d) => (
                <button
                  key={d}
                  onClick={() => setPathologist(pathologist === d ? null : d)}
                  className={`inline-flex items-center gap-0.5 max-w-full px-1.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                    pathologist === d ? "bg-[#1a3a5c] text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate min-w-0">{d}</span>
                  <span
                    onClick={(e) => { e.stopPropagation(); removeDoctor(d); }}
                    className="shrink-0 text-[8px] hover:text-red-400 cursor-pointer"
                  >✕</span>
                </button>
              ))}
            </div>
          )}
        </CollapsibleSection>

      </div>
    </aside>
  );
}
