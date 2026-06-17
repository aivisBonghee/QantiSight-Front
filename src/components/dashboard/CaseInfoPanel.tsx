"use client";

import { useState } from "react";
import type { SlideCase } from "@/types/case";

const IHC_STAINS = ["HER2", "ER", "PR", "KI67"];

function stainMatches(classification: string | undefined, caseStain: string): boolean {
  if (!classification || classification === "uncertain") return false;
  if (classification === "HE") return caseStain === "HE";
  if (classification.startsWith("IHC")) return IHC_STAINS.includes(caseStain);
  return classification === caseStain;
}

function MatchText({ match, label }: { match: boolean; label: string }) {
  return (
    <span className={`text-[12px] font-bold ${match ? "text-emerald-600" : "text-red-600"}`}>
      {label} ({match ? "일치" : "불일치"})
    </span>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[9px] text-gray-400 font-medium mb-0.5">{label}</div>
      <div className="text-[12px] font-semibold text-gray-800 truncate">{value || "-"}</div>
    </div>
  );
}

interface Props {
  slideCase: SlideCase;
  onClose: () => void;
}

export function CaseInfoPanel({ slideCase, onClose }: Props) {
  const qc = slideCase.qcResult;
  const [showHeatmap, setShowHeatmap] = useState(false);

  const isPass =
    qc && qc.organMatch && stainMatches(qc.stainClassification, slideCase.stainType) && qc.overallQcScore > 0;

  let lesionDetail: Record<string, number> | null = null;
  if (qc?.lesionDetail) {
    try { lesionDetail = JSON.parse(qc.lesionDetail); } catch {}
  }

  return (
    <div className="shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-top duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d5a87]">
        <div className="flex items-center gap-3">
          <span className="text-white font-mono text-sm font-bold">
            {slideCase.specimenNo || slideCase.slideId}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isPass ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"
            }`}
          >
            {isPass ? "적합" : "부적합"}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              slideCase.status === "DONE"
                ? "bg-white/15 text-white/80"
                : slideCase.status === "PROCESSING"
                ? "bg-amber-400/20 text-amber-200"
                : slideCase.status === "ERROR"
                ? "bg-red-400/20 text-red-200"
                : "bg-white/10 text-white/60"
            }`}
          >
            {slideCase.status === "DONE"
              ? "분석완료"
              : slideCase.status === "PROCESSING"
              ? "분석중"
              : slideCase.status === "ERROR"
              ? "오류"
              : "대기"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors text-sm font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex gap-4 p-4">
        {/* Left: Info grid */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Patient info */}
          <div className="grid grid-cols-6 gap-x-4 gap-y-2 pb-3 border-b border-gray-100">
            <Field label="조직번호" value={slideCase.specimenNo || slideCase.slideId} />
            <Field label="환자명" value={slideCase.patientName} />
            <Field label="차트번호" value={slideCase.patientId} />
            <Field label="나이" value="-" />
            <Field label="성별" value="-" />
            <Field label="접수일자" value={slideCase.examDate} />
          </div>

          {/* Row 2: QC info */}
          <div className="grid grid-cols-6 gap-x-4 gap-y-2 pt-3 pb-3 border-b border-gray-100">
            <Field
              label="장기"
              value={
                qc ? (
                  <div className="flex items-center gap-1.5">
                    <MatchText match={qc.organMatch} label={qc.detectedOrgan} />
                    <span className="text-[9px] text-gray-400">의뢰: {slideCase.organ}</span>
                  </div>
                ) : (
                  slideCase.organ
                )
              }
              className="col-span-2"
            />
            <Field
              label="염색"
              value={
                qc ? (
                  <div className="flex items-center gap-1.5">
                    <MatchText
                      match={stainMatches(qc.stainClassification, slideCase.stainType)}
                      label={qc.stainClassification}
                    />
                    <span className="text-[9px] text-gray-400">의뢰: {slideCase.stainType}</span>
                  </div>
                ) : (
                  slideCase.stainType
                )
              }
              className="col-span-2"
            />
            <Field
              label="QC 점수"
              value={
                qc?.overallQcScore ? (
                  <span
                    className={`font-extrabold ${
                      qc.overallQcScore >= 80
                        ? "text-emerald-600"
                        : qc.overallQcScore >= 60
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {qc.overallQcScore}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )
              }
            />
            <Field
              label="병변량"
              value={
                qc?.lesionAreaRatio != null ? (
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{(qc.lesionAreaRatio * 100).toFixed(1)}%</span>
                    {qc.lesionVolume && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          qc.lesionVolume === "Low"
                            ? "bg-emerald-100 text-emerald-700"
                            : qc.lesionVolume === "Moderate"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {qc.lesionVolume}
                      </span>
                    )}
                  </div>
                ) : (
                  "-"
                )
              }
            />
            <Field label="판독의" value={slideCase.pathologist} />
          </div>

          {/* Row 3: Lesion detail + Diagnosis */}
          <div className="grid grid-cols-6 gap-x-4 gap-y-2 pt-3 pb-3 border-b border-gray-100">
            {lesionDetail ? (
              <>
                {lesionDetail.n_tumor_cells != null && (
                  <Field label="종양 세포" value={lesionDetail.n_tumor_cells.toLocaleString()} />
                )}
                {lesionDetail.n_non_tumor_cells != null && (
                  <Field label="비종양 세포" value={lesionDetail.n_non_tumor_cells.toLocaleString()} />
                )}
                {lesionDetail.tumor_cell_fraction != null && (
                  <Field label="종양 비율" value={`${(lesionDetail.tumor_cell_fraction * 100).toFixed(1)}%`} />
                )}
                {lesionDetail.tissue_area_mm2 != null && (
                  <Field label="조직 면적" value={`${lesionDetail.tissue_area_mm2.toFixed(1)} mm²`} />
                )}
                <Field label="진단" value={slideCase.diagnosis} className="col-span-2" />
              </>
            ) : (
              <Field label="진단" value={slideCase.diagnosis} className="col-span-6" />
            )}
          </div>

          {/* Row 4: Comments */}
          {slideCase.comments && slideCase.comments.length > 0 && (
            <div className="pt-3">
              <div className="text-[9px] text-gray-400 font-medium mb-1">코멘트 ({slideCase.comments.length})</div>
              <div className="flex flex-col gap-1 max-h-[60px] overflow-y-auto">
                {slideCase.comments.map((c) => (
                  <div key={c.id} className="text-[11px] text-gray-700 bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">{c.content}</span>
                    <span className="text-[9px] text-gray-400 ml-2">{c.author} · {c.createdAt ? new Date(c.createdAt).toLocaleString("ko-KR") : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Thumbnail */}
        <div className="shrink-0 w-[200px] flex flex-col gap-2">
          {slideCase.thumbnailPath ? (
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={slideCase.thumbnailPath}
                alt={slideCase.slideId}
                className="w-full h-full object-cover"
              />
              {showHeatmap && qc?.heatmapPath && (
                <img
                  src={qc.heatmapPath}
                  alt="Cell density heatmap"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                />
              )}
              {qc?.heatmapPath && (
                <button
                  onClick={() => setShowHeatmap((v) => !v)}
                  className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transition-colors cursor-pointer ${
                    showHeatmap
                      ? "bg-[#1a3a5c] text-white"
                      : "bg-white/90 text-[#1a3a5c] hover:bg-white"
                  }`}
                >
                  {showHeatmap ? "Heatmap OFF" : "Heatmap ON"}
                </button>
              )}
              {qc?.overallQcScore ? (
                <div
                  className="absolute top-1.5 right-1.5 w-9 h-9 rounded-lg flex flex-col items-center justify-center shadow-md"
                  style={{
                    backgroundColor:
                      qc.overallQcScore >= 80
                        ? "#27BE69"
                        : qc.overallQcScore >= 60
                        ? "#FFCF0F"
                        : "#FF4242",
                  }}
                >
                  <span className="text-white text-[11px] font-extrabold">{qc.overallQcScore}</span>
                  <span className="text-white/70 text-[5px] font-medium">QC</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400">
                <div className="text-lg mb-0.5">🔬</div>
                <div className="text-[9px]">이미지 없음</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
