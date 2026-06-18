import type { SlideCase, QcResult, DashboardSummary, CaseFilters, CaseConfirmRequest, Comment } from "@/types/case";

interface ApiCaseResponse {
  id: string;
  slide_id: string;
  specimen_no: string | null;
  hospital_code: string;
  patient_id: string;
  patient_name: string;
  patient_age: number | null;
  patient_gender: string | null;
  pathologist: string | null;
  exam_no: string;
  exam_date: string;
  organ: string;
  stain_type: string;
  diagnosis: string | null;
  status: string;
  server_location: string | null;
  image_path: string | null;
  thumbnail_path: string | null;
  confirmed_at: string | null;
  suspected_disease: string | null;
  requested_stains: string | null;
  ihc_markers: string | null;
  molecular_test: string | null;
  clinical_info: string | null;
  created_at: string | null;
  qc_result: {
    id: string;
    focus_score: number | null;
    stain_quality: number | null;
    tissue_coverage: number | null;
    overall_qc_score: number | null;
    organ_match: boolean | null;
    detected_organ: string | null;
    organ_confidence: number | null;
    stain_classification: string | null;
    stain_confidence: number | null;
    lesion_area_ratio: number | null;
    lesion_volume: string | null;
    lesion_detail: string | null;
    heatmap_path: string | null;
    control_tissue_present: boolean | null;
    control_tissue_confidence: number | null;
    control_tissue_status: string | null;
    control_pieces: string | null;
    analyzed_at: string | null;
  } | null;
  comments: Array<{
    id: string;
    case_id: string;
    content: string;
    author: string;
    created_at: string | null;
  }>;
}

function mapCase(c: ApiCaseResponse): SlideCase {
  return {
    id: c.id,
    slideId: c.slide_id,
    specimenNo: c.specimen_no ?? "",
    hospitalCode: c.hospital_code as SlideCase["hospitalCode"],
    patientId: c.patient_id,
    patientName: c.patient_name,
    patientAge: c.patient_age,
    patientGender: c.patient_gender,
    examNo: c.exam_no,
    examDate: c.exam_date,
    organ: c.organ as SlideCase["organ"],
    stainType: c.stain_type as SlideCase["stainType"],
    diagnosis: c.diagnosis ?? "",
    status: c.status as SlideCase["status"],
    serverLocation: (c.server_location ?? "server-1") as SlideCase["serverLocation"],
    imagePath: c.image_path,
    thumbnailPath: c.thumbnail_path,
    confirmedAt: c.confirmed_at,
    suspectedDisease: c.suspected_disease,
    requestedStains: c.requested_stains,
    ihcMarkers: c.ihc_markers,
    molecularTest: c.molecular_test,
    clinicalInfo: c.clinical_info,
    pathologist: c.pathologist,
    createdAt: c.created_at ?? "",
    qcResult: c.qc_result
      ? {
          id: c.qc_result.id,
          focusScore: c.qc_result.focus_score ?? 0,
          stainQuality: c.qc_result.stain_quality ?? 0,
          tissueCoverage: c.qc_result.tissue_coverage ?? 0,
          overallQcScore: c.qc_result.overall_qc_score ?? 0,
          organMatch: c.qc_result.organ_match ?? false,
          detectedOrgan: c.qc_result.detected_organ ?? "",
          organConfidence: c.qc_result.organ_confidence ?? 0,
          stainClassification: c.qc_result.stain_classification ?? "",
          stainConfidence: c.qc_result.stain_confidence ?? 0,
          lesionAreaRatio: c.qc_result.lesion_area_ratio,
          lesionVolume: c.qc_result.lesion_volume as QcResult["lesionVolume"],
          lesionDetail: c.qc_result.lesion_detail,
          heatmapPath: c.qc_result.heatmap_path,
          controlTissuePresent: c.qc_result.control_tissue_present,
          controlTissueConfidence: c.qc_result.control_tissue_confidence,
          controlTissueStatus: c.qc_result.control_tissue_status,
          controlPieces: c.qc_result.control_pieces ? JSON.parse(c.qc_result.control_pieces) : null,
          analyzedAt: c.qc_result.analyzed_at ?? "",
        }
      : null,
    comments: (c.comments ?? []).map((cm) => ({
      id: cm.id,
      caseId: cm.case_id,
      content: cm.content,
      author: cm.author,
      createdAt: cm.created_at ?? "",
    })),
  };
}

function buildFilterParams(filters: CaseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.organs.length > 0) params.set("organ", filters.organs.join(","));
  if (filters.stainTypes.length > 0) params.set("stain_type", filters.stainTypes.join(","));
  if (filters.statuses.length > 0) params.set("status", filters.statuses.join(","));
  if (filters.hospitalCode) params.set("hospital_code", filters.hospitalCode);
  if (filters.serverLocation) params.set("server_location", filters.serverLocation);
  if (filters.organMatch) params.set("organ_match", filters.organMatch);
  if (filters.stainMatch) params.set("stain_match", filters.stainMatch);
  if (filters.controlTissue) params.set("control_tissue", filters.controlTissue);
  if (filters.qcGrade) params.set("qc_grade", filters.qcGrade);
  if (filters.hasIssue) params.set("has_issue", "true");
  if (filters.pathologist) params.set("pathologist", filters.pathologist);
  return params;
}

export interface CaseListResult {
  items: SlideCase[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchCases(
  filters: CaseFilters,
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = "created_at",
  sortDir: string = "desc",
): Promise<CaseListResult> {
  const params = buildFilterParams(filters);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  params.set("sort_by", sortBy);
  params.set("sort_dir", sortDir);

  const res = await fetch(`/api/cases?${params}`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  const data = await res.json();
  return {
    items: (data.items as ApiCaseResponse[]).map(mapCase),
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
  };
}

export async function fetchSummary(filters: CaseFilters): Promise<DashboardSummary> {
  const params = buildFilterParams(filters);
  const res = await fetch(`/api/cases/summary?${params}`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return await res.json();
}

export async function fetchCase(caseId: string): Promise<SlideCase> {
  const res = await fetch(`/api/cases/${caseId}`);
  if (!res.ok) throw new Error("Case not found");
  const data: ApiCaseResponse = await res.json();
  return mapCase(data);
}

export async function addComment(
  caseId: string,
  content: string,
): Promise<Comment> {
  const res = await fetch(`/api/cases/${caseId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  const data = await res.json();
  return {
    id: data.id,
    caseId: data.case_id,
    content: data.content,
    author: data.author,
    createdAt: data.created_at ?? "",
  };
}

export async function updateComment(
  caseId: string,
  commentId: string,
  content: string,
): Promise<Comment> {
  const res = await fetch(`/api/cases/${caseId}/comments/${commentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to update comment");
  const data = await res.json();
  return {
    id: data.id,
    caseId: data.case_id,
    content: data.content,
    author: data.author,
    createdAt: data.created_at ?? "",
  };
}

export async function deleteComment(
  caseId: string,
  commentId: string,
): Promise<void> {
  const res = await fetch(`/api/cases/${caseId}/comments/${commentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete comment");
}

export async function fetchAnalysisProgress(
  caseId: string,
): Promise<{ progress: number; step: string; status: string }> {
  try {
    const res = await fetch(`/api/analysis/${caseId}/progress`);
    if (!res.ok) return { progress: 0, step: "", status: "PROCESSING" };
    return await res.json();
  } catch {
    return { progress: 0, step: "", status: "PROCESSING" };
  }
}

export async function confirmCase(
  caseId: string,
  request: CaseConfirmRequest,
): Promise<SlideCase> {
  const body = {
    region_results: request.regionResults
      ? {
          blur_regions: request.regionResults.blurRegions ?? null,
          artifact_regions: request.regionResults.artifactRegions ?? null,
          tissue_region: request.regionResults.tissueRegion ?? null,
        }
      : null,
  };
  const res = await fetch(`/api/cases/${caseId}/confirm`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to confirm case");
  const data: ApiCaseResponse = await res.json();
  return mapCase(data);
}
