import type { SlideCase } from "@/types/case";

const IHC_STAINS = ["IHC-HER2", "IHC-ER", "IHC-PR", "IHC-KI67"];

export function stainMatches(classification: string | undefined, caseStain: string): boolean {
  if (!classification || classification === "uncertain") return false;
  if (classification === "HE") return caseStain === "HE";
  if (classification === "IHC-nuclear") return ["IHC-ER", "IHC-PR", "IHC-KI67"].includes(caseStain);
  if (classification === "IHC-membrane") return caseStain === "IHC-HER2";
  return classification === caseStain;
}

export type QcVerdict = "pass" | "insufficient" | "fail";

export function getQcVerdict(c: SlideCase): QcVerdict {
  if (!c.qcResult) return "fail";
  const qc = c.qcResult;

  const hasOrgan = !!c.organ?.trim();
  const hasStain = !!c.stainType?.trim();
  const organOk = !hasOrgan || qc.organMatch;
  const stainOk = !hasStain || stainMatches(qc.stainClassification, c.stainType);

  if (!organOk || !stainOk) return "fail";
  if (!hasOrgan || !hasStain) return "insufficient";
  if (qc.overallQcScore != null && qc.overallQcScore <= 0) return "fail";
  return "pass";
}
