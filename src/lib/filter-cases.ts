import type { SlideCase, CaseFilters } from "@/types/case";

export function filterCases(cases: SlideCase[], filters: CaseFilters): SlideCase[] {
  return cases.filter((c) => {
    if (filters.stainTypes.length > 0 && !filters.stainTypes.includes(c.stainType))
      return false;
    if (filters.organs.length > 0 && !filters.organs.includes(c.organ))
      return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(c.status))
      return false;
    if (filters.hospitalCode && c.hospitalCode !== filters.hospitalCode)
      return false;
    if (filters.serverLocation && c.serverLocation !== filters.serverLocation)
      return false;

    if (filters.organMatch && c.qcResult) {
      if (filters.organMatch === "match" && !c.qcResult.organMatch) return false;
      if (filters.organMatch === "mismatch" && c.qcResult.organMatch) return false;
    }
    if (filters.organMatch && !c.qcResult) return false;

    if (filters.controlTissue && c.qcResult) {
      if (filters.controlTissue === "present" && !c.qcResult.controlTissuePresent) return false;
      if (filters.controlTissue === "missing" && c.qcResult.controlTissuePresent !== false) return false;
    }
    if (filters.controlTissue && !c.qcResult) return false;

    if (filters.qcGrade && c.qcResult) {
      const score = c.qcResult.overallQcScore;
      if (filters.qcGrade === "good" && score < 80) return false;
      if (filters.qcGrade === "fair" && (score < 60 || score >= 80)) return false;
      if (filters.qcGrade === "poor" && score >= 60) return false;
    }
    if (filters.qcGrade && !c.qcResult) return false;

    if (filters.hasIssue) {
      if (!c.qcResult) return false;
      const hasAny =
        !c.qcResult.organMatch ||
        c.qcResult.stainClassification !== c.stainType ||
        c.qcResult.controlTissuePresent === false ||
        c.qcResult.overallQcScore < 60;
      if (!hasAny) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [
        c.slideId,
        c.patientName,
        c.patientId,
        c.examNo,
        c.diagnosis,
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });
}
