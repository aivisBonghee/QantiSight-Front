"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { MOCK_CASES } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ caseId: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  DONE: "완료",
  PROCESSING: "분석중",
  WAITING: "대기",
  ERROR: "오류",
};

const STATUS_STYLE: Record<string, string> = {
  DONE: "bg-emerald-50 text-emerald-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  WAITING: "bg-gray-50 text-gray-600",
  ERROR: "bg-red-50 text-red-700",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function PipelineStep({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
          done
            ? "bg-[#355C94] border-[#355C94] text-white"
            : active
            ? "border-[#355C94] text-[#355C94] bg-blue-50"
            : "border-gray-200 text-gray-400 bg-white"
        }`}
      >
        {done ? "✓" : ""}
      </div>
      <span
        className={`text-[10px] text-center leading-tight ${
          done || active ? "text-[#22487B] font-medium" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function PipelineConnector({ done }: { done: boolean }) {
  return (
    <div
      className={`flex-1 h-0.5 mt-4 ${done ? "bg-[#355C94]" : "bg-gray-200"}`}
    />
  );
}

export default function CaseDetailPage({ params }: Props) {
  const { caseId } = use(params);
  const slideCase = useMemo(
    () => MOCK_CASES.find((c) => c.id === caseId),
    [caseId]
  );

  if (!slideCase) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">케이스를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const qc = slideCase.qcResult;
  const isDone = slideCase.status === "DONE";
  const steps = ["업로드", "초점 검사", "염색 분석", "장기 감지", "병변 추정", "QC 완료"];
  const currentStep = isDone ? 6 : slideCase.status === "PROCESSING" ? 3 : slideCase.status === "ERROR" ? 2 : 0;

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b bg-white flex items-center px-6 gap-4 shrink-0">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#22487B]">
            {slideCase.slideId}
          </span>
          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLE[slideCase.status]}`}>
            {STATUS_LABEL[slideCase.status]}
          </Badge>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {slideCase.patientName} | {slideCase.examNo} | {slideCase.examDate}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 bg-[#F5F7FA]">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-5">
          {/* Pipeline */}
          <Card>
            <CardContent className="py-5 px-8">
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                자동 분석 프로세스
              </p>
              <div className="flex items-start">
                {steps.map((step, i) => (
                  <div key={step} className="contents">
                    <PipelineStep
                      label={step}
                      done={i < currentStep}
                      active={i === currentStep}
                    />
                    {i < steps.length - 1 && (
                      <PipelineConnector done={i < currentStep} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detail panels */}
          <div className="grid grid-cols-2 gap-4">
            {/* Organ Match */}
            <Card>
              <CardContent className="py-4 px-5">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  장기 일치 검증
                </p>
                {qc ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">라벨 장기</p>
                        <p className="text-lg font-semibold">{slideCase.organ}</p>
                      </div>
                      <div className="text-2xl">{qc.organMatch ? "=" : "≠"}</div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">감지 장기</p>
                        <p className="text-lg font-semibold">{qc.detectedOrgan}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          qc.organMatch
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {qc.organMatch ? "일치" : "불일치"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        신뢰도 {(qc.organConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          qc.organMatch ? "bg-emerald-500" : "bg-red-400"
                        }`}
                        style={{ width: `${qc.organConfidence * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">분석 대기 중...</p>
                )}
              </CardContent>
            </Card>

            {/* Stain Classification */}
            <Card>
              <CardContent className="py-4 px-5">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  염색 종류 분류
                </p>
                {qc ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">실제 염색</p>
                        <p className="text-lg font-semibold">{slideCase.stainType}</p>
                      </div>
                      <div className="text-2xl">
                        {qc.stainClassification === slideCase.stainType ? "=" : "≠"}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">분류 결과</p>
                        <p className="text-lg font-semibold">{qc.stainClassification}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          qc.stainClassification === slideCase.stainType
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }
                      >
                        {qc.stainClassification === slideCase.stainType ? "정확" : "불일치"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        신뢰도 {(qc.stainConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#355C94]"
                        style={{ width: `${qc.stainConfidence * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">분석 대기 중...</p>
                )}
              </CardContent>
            </Card>

            {/* Lesion Metrics */}
            <Card>
              <CardContent className="py-4 px-5">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  병변량 추정
                </p>
                {qc && qc.lesionAreaRatio !== null ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-bold text-[#22487B]">
                        {(qc.lesionAreaRatio * 100).toFixed(1)}%
                      </span>
                      <Badge
                        className={
                          qc.lesionVolume === "Low"
                            ? "bg-emerald-100 text-emerald-700"
                            : qc.lesionVolume === "Moderate"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {qc.lesionVolume}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      종양 영역 / 전체 조직 면적 비율
                    </p>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          qc.lesionVolume === "Low"
                            ? "bg-emerald-500"
                            : qc.lesionVolume === "Moderate"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${qc.lesionAreaRatio * 100}%` }}
                      />
                    </div>
                  </div>
                ) : qc ? (
                  <p className="text-sm text-muted-foreground">
                    비암 진단 - 병변량 데이터 없음
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">분석 대기 중...</p>
                )}
              </CardContent>
            </Card>

            {/* Quality Score */}
            <Card>
              <CardContent className="py-4 px-5">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  품질 평가
                </p>
                {qc ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={
                              (qc.overallQcScore ?? 0) >= 80
                                ? "#27BE69"
                                : (qc.overallQcScore ?? 0) >= 60
                                ? "#FFCF0F"
                                : "#FF4242"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${((qc.overallQcScore ?? 0) / 100) * 264} 264`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-[#22487B]">
                            {qc.overallQcScore}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <ScoreBar
                          label="Focus"
                          value={qc.focusScore}
                          color={qc.focusScore >= 70 ? "bg-[#355C94]" : "bg-red-400"}
                        />
                        <ScoreBar
                          label="Stain"
                          value={qc.stainQuality}
                          color={qc.stainQuality >= 70 ? "bg-[#355C94]" : "bg-amber-400"}
                        />
                        <ScoreBar
                          label="Tissue"
                          value={qc.tissueCoverage}
                          color={qc.tissueCoverage >= 50 ? "bg-[#355C94]" : "bg-amber-400"}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">분석 대기 중...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Slide Preview placeholder */}
          <Card>
            <CardContent className="py-6 px-5">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                슬라이드 프리뷰
              </p>
              <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xl">🔬</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    이미지 업로드 후 프리뷰가 표시됩니다
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {slideCase.hospitalCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
