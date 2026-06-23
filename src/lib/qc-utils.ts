import type { SlideCase } from "@/types/case";
import { useFilters } from "@/hooks/useFilters";

const IHC_STAINS = ["IHC-HER2", "IHC-ER", "IHC-PR", "IHC-KI67"];

export type QcThresholds = { pass: number; conditional: number; rescan: number };

export const QC_THRESHOLDS: QcThresholds = { pass: 85, conditional: 70, rescan: 50 };

export type QcScoreGrade = "pass" | "conditional" | "rescan" | "fail";

export function getQcScoreGrade(score: number | null | undefined, t: QcThresholds = QC_THRESHOLDS): QcScoreGrade {
  if (score == null) return "fail";
  if (score >= t.pass) return "pass";
  if (score >= t.conditional) return "conditional";
  if (score >= t.rescan) return "rescan";
  return "fail";
}

export function getQcScoreColor(score: number | null | undefined, t: QcThresholds = QC_THRESHOLDS): string {
  switch (getQcScoreGrade(score, t)) {
    case "pass": return "#1a3a5c";
    case "conditional": return "#F59E0B";
    case "rescan": return "#FF8C00";
    case "fail": return "#FF4242";
  }
}

export function getQcScoreTextClass(score: number | null | undefined, t: QcThresholds = QC_THRESHOLDS): string {
  switch (getQcScoreGrade(score, t)) {
    case "pass": return "text-gray-900";
    case "conditional": return "text-amber-500";
    case "rescan": return "text-orange-500";
    case "fail": return "text-red-600";
  }
}

export function useQcScore() {
  const t = useFilters((s) => s.qcThresholds);
  return {
    getGrade: (score: number | null | undefined) => getQcScoreGrade(score, t),
    getColor: (score: number | null | undefined) => getQcScoreColor(score, t),
    getTextClass: (score: number | null | undefined) => getQcScoreTextClass(score, t),
    thresholds: t,
  };
}

const STAIN_DISPLAY_MAP: Record<string, string> = {
  "IHC-HER2": "IHC-membrane",
  "IHC-ER": "IHC-nuclear",
  "IHC-PR": "IHC-nuclear",
  "IHC-KI67": "IHC-nuclear",
};

export function displayStain(stain: string | null | undefined): string {
  if (!stain) return "-";
  return STAIN_DISPLAY_MAP[stain] ?? stain;
}

export function stainMatches(classification: string | undefined, caseStain: string): boolean {
  if (!classification || classification === "uncertain") return false;
  if (classification === "HE") return caseStain === "HE";
  if (classification === "IHC-nuclear") return caseStain === "IHC-nuclear" || ["IHC-ER", "IHC-PR", "IHC-KI67"].includes(caseStain);
  if (classification === "IHC-membrane") return caseStain === "IHC-membrane" || caseStain === "IHC-HER2";
  return classification === caseStain;
}

export type QcVerdict = "pass" | "caution" | "fail" | "critical" | "insufficient";

function _isIHC(stain: string): boolean {
  return IHC_STAINS.includes(stain) || stain === "IHC-membrane" || stain === "IHC-nuclear";
}

export function getQcVerdict(c: SlideCase, t: QcThresholds = QC_THRESHOLDS): QcVerdict {
  if (!c.qcResult) return "fail";
  const qc = c.qcResult;

  const hasOrgan = !!c.organ?.trim();
  const hasStain = !!c.stainType?.trim();
  if (!hasOrgan || !hasStain) return "insufficient";

  // Gate 1: Consistency — organ/stain match, IHC control tissue
  if (!qc.organMatch) return "fail";
  if (!stainMatches(qc.stainClassification, c.stainType)) return "fail";
  if (_isIHC(c.stainType) && qc.controlTissueStatus && qc.controlTissueStatus !== "present" && qc.controlTissueStatus !== "n/a") {
    return "fail";
  }

  // Gate 2: Adequacy — cell count ≥ 2,000
  if (qc.lesionDetail) {
    try {
      const detail = JSON.parse(qc.lesionDetail);
      const total = (detail.n_tumor_cells ?? 0) + (detail.n_non_tumor_cells ?? 0);
      if (total > 0 && total < 2000) return "fail";
    } catch {}
  }

  // Gate 3: Severity — QC score
  if (qc.overallQcScore == null) return "fail";
  if (qc.overallQcScore >= t.pass) return "pass";
  if (qc.overallQcScore >= t.conditional) return "caution";
  if (qc.overallQcScore >= t.rescan) return "fail";
  return "critical";
}
