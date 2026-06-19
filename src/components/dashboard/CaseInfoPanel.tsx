"use client";

import { useState } from "react";
import type { SlideCase } from "@/types/case";
import { stainMatches, getQcVerdict } from "@/lib/qc-utils";
import { addComment, updateComment, deleteComment } from "@/lib/api-client";

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
      <div className="text-[9px] text-gray-500 font-medium mb-0.5">{label}</div>
      <div className="text-[12px] font-bold text-gray-900 truncate">{value || "-"}</div>
    </div>
  );
}

interface Props {
  slideCase: SlideCase;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function CaseInfoPanel({ slideCase, onClose, onCommentAdded }: Props) {
  const qc = slideCase.qcResult;
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const verdict = getQcVerdict(slideCase);

  let lesionDetail: Record<string, number> | null = null;
  if (qc?.lesionDetail) {
    try { lesionDetail = JSON.parse(qc.lesionDetail); } catch {}
  }

  return (
    <div className="shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d5a87]">
        <div className="flex items-center gap-3">
          <span className="text-white font-mono text-sm font-bold">
            {slideCase.specimenNo || slideCase.slideId}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              verdict === "pass" ? "bg-emerald-400/20 text-emerald-200"
                : verdict === "insufficient" ? "bg-amber-400/20 text-amber-200"
                : "bg-red-500/30 text-red-300"
            }`}
          >
            {verdict === "pass" ? "적합" : verdict === "insufficient" ? (
              <span className="inline-flex items-center gap-0.5">
                불충분
                <span className="cursor-help" title="기입 정보가 부족하여 분석 정보와 비교할 수 없는 항목이 있습니다">&#9432;</span>
              </span>
            ) : "부적합"}
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
      <div className="flex gap-4 px-4 py-3">
        {/* Left: Info grid */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Patient info */}
          <div className="grid grid-cols-6 gap-x-4 gap-y-1.5 pb-2 border-b border-gray-100">
            <Field label="조직번호" value={slideCase.specimenNo || slideCase.slideId} />
            <Field label="환자명" value={slideCase.patientName} />
            <Field label="나이/성별" value={
              slideCase.patientAge || slideCase.patientGender
                ? [slideCase.patientAge ? `${slideCase.patientAge}세` : null, slideCase.patientGender].filter(Boolean).join(" / ")
                : "-"
            } />
            <Field label="차트번호" value={slideCase.patientId} />
            <Field label="접수일자" value={slideCase.examDate} />
            <Field label="판독의" value={slideCase.pathologist} />
          </div>

          {/* Row 2: QC info */}
          <div className="grid grid-cols-5 gap-x-6 gap-y-1.5 pt-2 pb-2 border-b border-gray-100">
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
                            ? "bg-red-100 text-red-700"
                            : qc.lesionVolume === "Moderate"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
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
            <Field
              label="컨트롤 티슈"
              value={
                qc?.controlTissueStatus ? (
                  <span
                    className={`text-[12px] font-bold ${
                      qc.controlTissueStatus === "present"
                        ? "text-emerald-600"
                        : qc.controlTissueStatus === "absent"
                        ? "text-red-600"
                        : qc.controlTissueStatus === "uncertain"
                        ? "text-amber-600"
                        : "text-gray-400"
                    }`}
                  >
                    {qc.controlTissueStatus === "present"
                      ? "검출"
                      : qc.controlTissueStatus === "absent"
                      ? "미검출"
                      : qc.controlTissueStatus === "uncertain"
                      ? "불확실"
                      : "해당없음"}
                    {qc.controlPieces && qc.controlPieces.length > 0 && (
                      <span className="text-[9px] text-gray-400 font-normal ml-1">
                        ({qc.controlPieces.length}개, {Math.round(qc.controlPieces[0].p * 100)}%)
                      </span>
                    )}
                  </span>
                ) : (
                  "-"
                )
              }
            />
          </div>

          {/* Row 3: Detail info */}
          <div className="grid grid-cols-4 gap-x-6 gap-y-1.5 pt-2 pb-2 border-b border-gray-100">
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
              </>
            ) : null}
          </div>

          {/* Comments */}
          <div className="pt-2">
            <div className="text-[9px] text-gray-500 font-medium mb-1">코멘트</div>
            <div className="max-h-[60px] overflow-y-auto mb-1.5">
              {slideCase.comments && slideCase.comments.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {slideCase.comments.map((c) => (
                    <div key={c.id} className="group flex items-center gap-1 text-[11px] text-gray-700 bg-gray-50 rounded px-2 py-1">
                      {editingId === c.id ? (
                        <form className="flex-1 flex items-center gap-1" onSubmit={async (e) => {
                          e.preventDefault();
                          if (!editText.trim()) return;
                          setIsSaving(true);
                          try {
                            await updateComment(slideCase.id, c.id, editText.trim());
                            setEditingId(null);
                            onCommentAdded?.();
                          } finally { setIsSaving(false); }
                        }}>
                          <input value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus
                            className="flex-1 h-5 px-1 rounded border text-[11px] outline-none" />
                          <button type="submit" disabled={isSaving}
                            className="text-[9px] text-blue-600 hover:underline cursor-pointer">저장</button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="text-[9px] text-gray-400 hover:underline cursor-pointer">취소</button>
                        </form>
                      ) : (
                        <>
                          <span className="font-medium flex-1">{c.content}</span>
                          <span className="text-[9px] text-gray-400 shrink-0">{c.author}</span>
                          <button onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                            className="text-[9px] text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">수정</button>
                          <button onClick={async () => {
                            await deleteComment(slideCase.id, c.id);
                            onCommentAdded?.();
                          }}
                            className="text-[9px] text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">삭제</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] font-bold text-gray-900">-</div>
              )}
            </div>
            <form className="flex items-center gap-1" onSubmit={async (e) => {
              e.preventDefault();
              if (!commentText.trim()) return;
              setIsSaving(true);
              try {
                await addComment(slideCase.id, commentText.trim());
                setCommentText("");
                onCommentAdded?.();
              } finally { setIsSaving(false); }
            }}>
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="코멘트 입력..."
                className="flex-1 h-6 px-2 rounded border border-gray-200 text-[11px] outline-none focus:border-[#355C94]" />
              <button type="submit" disabled={!commentText.trim() || isSaving}
                className="h-6 px-2 rounded bg-[#355C94] text-white text-[10px] font-bold disabled:opacity-40 cursor-pointer hover:bg-[#22487B] transition-colors">추가</button>
            </form>
          </div>
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
              {qc?.controlPieces && qc.controlPieces.length > 0 && !showHeatmap && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {qc.controlPieces.map((piece, i) => {
                    const raw = piece as Record<string, unknown>;
                    const b = (raw.bbox_pct ?? raw.bbox) as number[] | undefined;
                    if (!b || b.length < 4 || b.some((v) => v > 1)) return null;
                    return (
                      <rect
                        key={i}
                        x={`${b[0] * 100}%`}
                        y={`${b[1] * 100}%`}
                        width={`${(b[2] - b[0]) * 100}%`}
                        height={`${(b[3] - b[1]) * 100}%`}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        rx="2"
                      />
                    );
                  })}
                  <text x="4" y="12" fontSize="8" fill="#22d3ee" fontWeight="bold">Control</text>
                </svg>
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
