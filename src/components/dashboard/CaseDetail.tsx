"use client";

import { useEffect, useState } from "react";
import type { SlideCase } from "@/types/case";
import { addComment, updateComment, deleteComment } from "@/lib/api-client";
import { stainMatches } from "@/lib/qc-utils";

interface Props {
  slideCase: SlideCase;
  onClose: () => void;
  onCommentAdded?: () => void;
}

function AnimatedGauge({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimVal(value), 50);
    return () => clearTimeout(t);
  }, [value]);

  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animVal / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-extrabold text-gray-800">{value}</span>
      </div>
    </div>
  );
}

function AnimatedBar({ value, color, label }: { value: number; color: string; label: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 80);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div>
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="font-bold text-gray-700">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

function PipelineSteps({ current }: { current: number }) {
  const steps = ["업로드", "분석", "완료"];
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center relative z-10">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-500 ${
                i < current
                  ? "bg-[#1a3a5c] border-[#1a3a5c] text-white shadow-sm"
                  : i === current
                  ? "border-[#1a3a5c] text-[#1a3a5c] bg-blue-50 shadow-sm"
                  : "border-gray-200 text-gray-400 bg-white"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-[8px] mt-0.5 whitespace-nowrap ${
                i < current ? "text-[#1a3a5c] font-bold" : i === current ? "text-[#1a3a5c] font-semibold" : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 relative mx-[-2px]">
              <div className="h-[3px] bg-gray-200 rounded-full" />
              <div
                className={`absolute top-0 left-0 h-[3px] rounded-full transition-all duration-700 ease-out ${
                  i < current ? "bg-[#1a3a5c] w-full" : "bg-transparent w-0"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MockSlidePreview({ qcScore }: { qcScore: number | null }) {
  const s = qcScore ?? 0;
  const scoreColor = s >= 80 ? "#27BE69" : s >= 60 ? "#FFCF0F" : "#FF4242";

  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-[#f0e4f5] via-[#e8d0e8] to-[#d8c0d8]">
      <svg viewBox="0 0 300 220" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="t1" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#c9a0d0" />
            <stop offset="100%" stopColor="#e0c0e5" />
          </radialGradient>
          <radialGradient id="t2" cx="30%" cy="40%">
            <stop offset="0%" stopColor="#b080b8" />
            <stop offset="100%" stopColor="#d0a8d5" />
          </radialGradient>
        </defs>
        <ellipse cx="150" cy="110" rx="130" ry="90" fill="url(#t1)" opacity="0.7" />
        <ellipse cx="100" cy="85" rx="60" ry="45" fill="url(#t2)" opacity="0.5" />
        <ellipse cx="200" cy="130" rx="50" ry="35" fill="#c890d0" opacity="0.4" />
        {Array.from({ length: 30 }, (_, i) => (
          <circle
            key={i}
            cx={30 + ((i * 47) % 240)}
            cy={20 + ((i * 31) % 180)}
            r={2 + (i % 4)}
            fill={i % 3 === 0 ? "#9060a0" : "#b888c0"}
            opacity={0.3 + (i % 3) * 0.15}
          />
        ))}
        <rect x="55" y="35" width="45" height="30" rx="4" fill="none" stroke="#FF4242" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="175" y="105" width="40" height="28" rx="4" fill="none" stroke="#FFCF0F" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
        </rect>
        <ellipse cx="150" cy="110" rx="125" ry="85" fill="none" stroke="#27BE69" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.5" />
      </svg>
      <div className="absolute top-2 right-2 w-11 h-11 rounded-xl flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: scoreColor }}>
        <span className="text-white text-sm font-extrabold">{qcScore}</span>
        <span className="text-white/70 text-[6px] font-medium">QC</span>
      </div>
      <div className="absolute bottom-1.5 left-1.5 flex gap-1.5">
        <span className="flex items-center gap-0.5 text-[7px] text-white/80 bg-black/25 px-1 py-0.5 rounded">
          <span className="w-1 h-1 rounded-full bg-emerald-400" /> Tissue
        </span>
        <span className="flex items-center gap-0.5 text-[7px] text-white/80 bg-black/25 px-1 py-0.5 rounded">
          <span className="w-1 h-1 rounded-full bg-red-400" /> Blur
        </span>
        <span className="flex items-center gap-0.5 text-[7px] text-white/80 bg-black/25 px-1 py-0.5 rounded">
          <span className="w-1 h-1 rounded-full bg-amber-400" /> Artifact
        </span>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b">
      <div className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-2">{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="text-gray-400 font-medium shrink-0 w-16">{label}</span>
      <span className="text-gray-700 font-semibold">{value}</span>
    </div>
  );
}

function TagList({ items }: { items: string }) {
  const tags = items.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e8edf4] text-[#355C94]">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function CaseDetail({ slideCase, onClose, onCommentAdded }: Props) {
  const qc = slideCase.qcResult;
  const isDone = slideCase.status === "DONE";
  const currentStep = isDone ? 3 : slideCase.status === "PROCESSING" ? 1 : slideCase.status === "ERROR" ? 1 : 0;
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(slideCase.comments ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    setLocalComments(slideCase.comments ?? []);
  }, [slideCase.id, slideCase.comments]);

  const handleAddComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await addComment(slideCase.id, commentText.trim());
      setLocalComments((prev) => [...prev, comment]);
      setCommentText("");
      onCommentAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const updated = await updateComment(slideCase.id, commentId, editText.trim());
      setLocalComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditText("");
      onCommentAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteComment(slideCase.id, commentId);
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-[#2d5a87] text-white shrink-0">
        <div>
          <div className="font-mono text-sm font-bold">{slideCase.specimenNo || slideCase.slideId}</div>
          <div className="text-[10px] text-white/60 mt-0.5">
            {slideCase.patientName} · {slideCase.organ} · {slideCase.stainType}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors text-base font-bold"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Patient & Requisition Info */}
        <Section title="환자 / 의뢰 정보">
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <InfoRow label="환자 ID" value={slideCase.patientId} />
              <InfoRow label="검사번호" value={slideCase.examNo} />
              <InfoRow label="검사일" value={slideCase.examDate} />
              <InfoRow label="병원" value={slideCase.hospitalCode} />
            </div>
            {slideCase.suspectedDisease && (
              <div className="mt-1">
                <InfoRow label="의심 질환" value={slideCase.suspectedDisease} />
              </div>
            )}
            {slideCase.requestedStains && (
              <div className="mt-1">
                <span className="text-[11px] text-gray-400 font-medium">의뢰 염색</span>
                <div className="mt-0.5"><TagList items={slideCase.requestedStains} /></div>
              </div>
            )}
            {slideCase.ihcMarkers && (
              <div className="mt-1">
                <span className="text-[11px] text-gray-400 font-medium">IHC 마커</span>
                <div className="mt-0.5"><TagList items={slideCase.ihcMarkers} /></div>
              </div>
            )}
            {slideCase.molecularTest && (
              <div className="mt-1">
                <InfoRow label="분자병리" value={slideCase.molecularTest} />
              </div>
            )}
            {slideCase.clinicalInfo && (
              <div className="mt-1.5 p-2 bg-gray-50 rounded text-[11px] text-gray-600 leading-relaxed">
                {slideCase.clinicalInfo}
              </div>
            )}
          </div>
        </Section>

        {/* Pipeline */}
        <Section title="분석 프로세스">
          <PipelineSteps current={currentStep} />
        </Section>

        {/* Slide Preview */}
        <Section title="슬라이드 프리뷰">
          {slideCase.thumbnailPath ? (
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
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
                  className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-lg shadow-md transition-colors ${
                    showHeatmap
                      ? "bg-[#1a3a5c] text-white"
                      : "bg-white/90 text-[#1a3a5c] hover:bg-white"
                  }`}
                >
                  {showHeatmap ? "Heatmap OFF" : "Heatmap ON"}
                </button>
              )}
              {qc && (
                <div
                  className="absolute top-2 right-2 w-11 h-11 rounded-xl flex flex-col items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: (qc.overallQcScore ?? 0) >= 80 ? "#27BE69" : (qc.overallQcScore ?? 0) >= 60 ? "#FFCF0F" : "#FF4242",
                  }}
                >
                  <span className="text-white text-sm font-extrabold">{qc.overallQcScore ?? "-"}</span>
                  <span className="text-white/70 text-[6px] font-medium">QC</span>
                </div>
              )}
            </div>
          ) : qc ? (
            <MockSlidePreview qcScore={qc.overallQcScore} />
          ) : (
            <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400">
                <div className="text-xl mb-1">🔬</div>
                <div className="text-[11px]">이미지 업로드 후 표시</div>
              </div>
            </div>
          )}
        </Section>

        {/* Quality Score */}
        <Section title="품질 평가">
          {qc ? (
            <div>
              {qc.overallQcScore ? (
                <div className="flex items-center gap-4">
                  <AnimatedGauge
                    value={qc.overallQcScore}
                    color={qc.overallQcScore >= 80 ? "#27BE69" : qc.overallQcScore >= 60 ? "#FFCF0F" : "#FF4242"}
                  />
                  <div className="flex-1 flex flex-col gap-2">
                    {qc.focusScore ? <AnimatedBar label="Focus Score" value={qc.focusScore} color={qc.focusScore >= 70 ? "bg-[#1a3a5c]" : "bg-red-400"} /> : null}
                    {qc.stainQuality ? <AnimatedBar label="Stain Quality" value={qc.stainQuality} color={qc.stainQuality >= 70 ? "bg-[#1a3a5c]" : "bg-amber-400"} /> : null}
                    {qc.tissueCoverage ? <AnimatedBar label="Tissue Coverage" value={qc.tissueCoverage} color={qc.tissueCoverage >= 50 ? "bg-[#1a3a5c]" : "bg-amber-400"} /> : null}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">품질 점수 미지원 (AI 모델 범위 외)</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
        </Section>

        {/* Organ + Stain side by side */}
        <div className="grid grid-cols-2 border-b">
          {/* Organ */}
          <div className="px-4 py-3 border-r">
            <div className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-2">장기</div>
            {qc ? (
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] text-gray-500">의뢰: <span className="font-bold text-gray-700">{slideCase.organ}</span></div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    qc.organMatch ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    {qc.detectedOrgan}
                  </span>
                  <span className="text-[10px] text-gray-400">{(qc.organConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">-</p>
            )}
          </div>

          {/* Stain */}
          <div className="px-4 py-3">
            <div className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-2">염색</div>
            {qc ? (
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] text-gray-500">의뢰: <span className="font-bold text-gray-700">{slideCase.stainType}</span></div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    stainMatches(qc.stainClassification, slideCase.stainType) ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    {qc.stainClassification}
                  </span>
                  <span className="text-[10px] text-gray-400">{(qc.stainConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">-</p>
            )}
          </div>
        </div>

        {/* Control Tissue */}
        <Section title="컨트롤 티슈 발현">
          {qc ? (
            qc.controlTissuePresent === null || qc.controlTissuePresent === undefined ? (
              <p className="text-[11px] text-gray-400 italic">컨트롤 티슈 검출 미지원 (AI 모델 범위 외)</p>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                    qc.controlTissuePresent
                      ? "bg-purple-100 text-purple-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {qc.controlTissuePresent ? "✓" : "✗"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        qc.controlTissuePresent ? "text-purple-700" : "text-red-700"
                      }`}
                    >
                      {qc.controlTissuePresent ? "발현 확인" : "미발현"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {(qc.controlTissueConfidence! * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {qc.controlTissuePresent
                      ? "컨트롤 티슈에서 정상 발현이 확인되었습니다"
                      : "컨트롤 티슈 미발현 — 염색 재검토 필요"}
                  </p>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
        </Section>

        {/* Lesion */}
        <Section title="병변량 추정">
          {qc && qc.lesionAreaRatio !== null ? (
            <div>
              <div className="flex items-end gap-2 mb-1.5">
                <span className="text-2xl font-extrabold text-gray-800">
                  {(qc.lesionAreaRatio * 100).toFixed(1)}%
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                  qc.lesionVolume === "Low" ? "bg-red-100 text-red-700"
                  : qc.lesionVolume === "Moderate" ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
                }`}>
                  {qc.lesionVolume}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    qc.lesionVolume === "Low" ? "bg-red-500"
                    : qc.lesionVolume === "Moderate" ? "bg-amber-500"
                    : "bg-emerald-500"
                  }`}
                  style={{ width: `${qc.lesionAreaRatio * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">종양 / 조직 면적 비율</div>
              {(() => {
                if (!qc.lesionDetail) return null;
                try {
                  const d = JSON.parse(qc.lesionDetail);
                  return (
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                      {d.n_tumor_cells != null && (
                        <div><span className="text-gray-400">종양 세포</span> <span className="font-bold text-gray-700">{d.n_tumor_cells.toLocaleString()}</span></div>
                      )}
                      {d.n_non_tumor_cells != null && (
                        <div><span className="text-gray-400">비종양 세포</span> <span className="font-bold text-gray-700">{d.n_non_tumor_cells.toLocaleString()}</span></div>
                      )}
                      {d.tumor_cell_fraction != null && (
                        <div><span className="text-gray-400">종양 세포 비율</span> <span className="font-bold text-gray-700">{(d.tumor_cell_fraction * 100).toFixed(1)}%</span></div>
                      )}
                      {d.tumor_cell_density_per_mm2 != null && (
                        <div><span className="text-gray-400">밀도</span> <span className="font-bold text-gray-700">{d.tumor_cell_density_per_mm2.toFixed(1)}/mm²</span></div>
                      )}
                      {d.tissue_area_mm2 != null && (
                        <div className="col-span-2"><span className="text-gray-400">조직 면적</span> <span className="font-bold text-gray-700">{d.tissue_area_mm2.toFixed(1)} mm²</span></div>
                      )}
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>
          ) : qc ? (
            <p className="text-xs text-gray-400 italic">비암 진단 - 데이터 없음</p>
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
        </Section>

        {/* Diagnosis */}
        <div className="px-4 py-3 border-b">
          <div className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">진단</div>
          <p className="text-sm font-semibold text-gray-800">{slideCase.diagnosis}</p>
        </div>

        {/* Comments */}
        <Section title={`코멘트 (${localComments.length})`}>
          <div className="flex flex-col gap-2">
            {localComments.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {localComments.map((c) => (
                  <div key={c.id} className="p-2 bg-gray-50 rounded group">
                    {editingId === c.id ? (
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-[11px] border rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#355C94] min-h-[50px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleUpdateComment(c.id);
                            if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                          }}
                        />
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setEditingId(null); setEditText(""); }} className="text-[10px] px-2 py-0.5 rounded text-gray-500 hover:bg-gray-200 transition-colors">취소</button>
                          <button onClick={() => handleUpdateComment(c.id)} disabled={!editText.trim() || submitting} className="text-[10px] px-2 py-0.5 rounded bg-[#355C94] text-white hover:bg-[#22487B] disabled:opacity-40 transition-colors">저장</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2 text-[9px] text-gray-400">
                            <span>{c.author}</span>
                            <span>·</span>
                            <span>{c.createdAt ? new Date(c.createdAt).toLocaleString("ko-KR") : ""}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(c.id); setEditText(c.content); }} className="text-[9px] text-gray-400 hover:text-[#355C94] transition-colors">수정</button>
                            <button onClick={() => handleDeleteComment(c.id)} className="text-[9px] text-gray-400 hover:text-red-500 transition-colors">삭제</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">작성된 코멘트가 없습니다</p>
            )}
            <div className="flex gap-1.5 mt-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="코멘트를 입력하세요..."
                className="flex-1 text-[11px] border rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#355C94] min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                }}
              />
            </div>
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || submitting}
              className="self-end text-[11px] font-bold px-3 py-1.5 rounded bg-[#355C94] text-white hover:bg-[#22487B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
