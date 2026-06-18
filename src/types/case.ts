export type HospitalCode = "SMC" | "KUMC" | "HALLYM" | "SCHMC";
export type StainType = "HE" | "HER2" | "ER" | "PR" | "KI67";
export type OrganType =
  | "Breast"
  | "Stomach"
  | "Bladder"
  | "Thyroid"
  | "Colon"
  | "Brain";
export type CaseStatus = "WAITING" | "PROCESSING" | "DONE" | "CONFIRMED" | "ERROR";
export type LesionVolume = "Low" | "Moderate" | "High";
export type ServerLocation =
  | "server-1"
  | "server-2"
  | "server-3"
  | "server-4"
  | "server-5";

export interface Comment {
  id: string;
  caseId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface SlideCase {
  id: string;
  slideId: string;
  specimenNo: string;
  hospitalCode: HospitalCode;
  patientId: string;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  examNo: string;
  examDate: string;
  organ: OrganType;
  stainType: StainType;
  diagnosis: string;
  pathologist?: string | null;
  status: CaseStatus;
  serverLocation: ServerLocation;
  imagePath: string | null;
  thumbnailPath: string | null;
  confirmedAt: string | null;
  suspectedDisease: string | null;
  requestedStains: string | null;
  ihcMarkers: string | null;
  molecularTest: string | null;
  clinicalInfo: string | null;
  createdAt: string;
  qcResult: QcResult | null;
  comments: Comment[];
}

export interface RegionResult {
  score?: number | null;
  coordinates?: Array<Record<string, unknown>> | null;
  metadata?: Record<string, unknown> | null;
}

export interface RegionResults {
  blurRegions?: RegionResult | null;
  artifactRegions?: RegionResult | null;
  tissueRegion?: RegionResult | null;
}

export interface CaseConfirmRequest {
  regionResults?: RegionResults | null;
}

export interface QcResult {
  id: string;
  focusScore: number;
  stainQuality: number;
  tissueCoverage: number;
  overallQcScore: number;
  organMatch: boolean;
  detectedOrgan: string;
  organConfidence: number;
  stainClassification: string;
  stainConfidence: number;
  lesionAreaRatio: number | null;
  lesionVolume: LesionVolume | null;
  lesionDetail?: string | null;
  heatmapPath?: string | null;
  controlTissuePresent: boolean | null;
  controlTissueConfidence: number | null;
  analyzedAt: string;
}

export type QcGrade = "good" | "fair" | "poor";
export type OrganMatchFilter = "match" | "mismatch";
export type ControlTissueFilter = "present" | "missing";

export interface CaseFilters {
  stainTypes: StainType[];
  organs: OrganType[];
  statuses: CaseStatus[];
  hospitalCode: HospitalCode | null;
  search: string;
  organMatch: OrganMatchFilter | null;
  stainMatch: OrganMatchFilter | null;
  controlTissue: ControlTissueFilter | null;
  qcGrade: QcGrade | null;
  serverLocation: ServerLocation | null;
  hasIssue: boolean;
  pathologist: string | null;
}

export interface DashboardSummary {
  totalCases: number;
  organMatchRate: number;
  organMismatchCount: number;
  stainAccuracy: number;
  avgLesionRatio: number;
  lesionDistribution: { low: number; moderate: number; high: number };
  avgQcScore: number;
  focusIssueCount: number;
  controlTissueRate: number;
  controlTissueMissingCount: number;
}
