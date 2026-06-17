"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useUploadStore, type UploadItem } from "@/hooks/useUploadStore";

const ACCEPTED = ".svs,.tiff,.tif,.ndpi,.mrxs,.scn,.bif,.vsi,.dcm";
const ORGANS = ["Stomach", "Colon", "Breast", "Lung", "Kidney"];
const STAINS = ["HE", "HER2", "ER", "PR", "KI67"];

function splitCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

function findCol(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function colVal(cols: string[], idx: number): string {
  return idx >= 0 && idx < cols.length ? cols[idx].trim() : "";
}

function parseCSVMapping(text: string): Map<string, Partial<UploadItem>> {
  const map = new Map<string, Partial<UploadItem>>();
  const clean = text.replace(/^﻿/, "").trim();
  const lines = clean.split(/\r?\n/);
  if (lines.length < 2) return map;

  const headers = splitCSVRow(lines[0]).map((h) => h.toLowerCase().replace(/\s/g, ""));
  const iSlide = findCol(headers, "검체번호", "slide_id", "검체");
  const iPid = findCol(headers, "환자id", "patient_id", "환자번호");
  const iName = findCol(headers, "환자명", "patient_name", "이름");
  const iOrgan = findCol(headers, "장기", "organ");
  const iStain = findCol(headers, "염색", "stain_type", "stain");

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = splitCSVRow(lines[i]);
    const slideId = colVal(cols, iSlide !== -1 ? iSlide : 0);
    if (!slideId) continue;
    map.set(slideId, {
      patientId: colVal(cols, iPid),
      patientName: colVal(cols, iName),
      organ: colVal(cols, iOrgan),
      stainType: colVal(cols, iStain),
    });
  }
  return map;
}

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mappingResult, setMappingResult] = useState<{ matched: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const items = useUploadStore((s) => s.items);
  const addFiles = useUploadStore((s) => s.addFiles);
  const removeItem = useUploadStore((s) => s.removeItem);
  const clearDone = useUploadStore((s) => s.clearDone);
  const updateItem = useUploadStore((s) => s.updateItem);
  const applyMapping = useUploadStore((s) => s.applyMapping);
  const startUpload = useUploadStore((s) => s.startUpload);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const mapping = parseCSVMapping(text);
      const result = applyMapping(mapping);
      setMappingResult(result);
      setTimeout(() => setMappingResult(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const header = "검체번호,환자ID,환자명,장기,염색";
    const rows = items
      .filter((f) => f.status === "pending")
      .map((f) => {
        const sid = f.specimenNo.includes(",") ? `"${f.specimenNo}"` : f.specimenNo;
        return `${sid},,,,`;
      });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function getExt(name: string) { return name.split(".").pop()?.toUpperCase() ?? ""; }

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 bg-[#1a3a5c] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            대시보드
          </Link>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-white text-sm font-semibold">슬라이드 업로드</span>
        </div>
        {uploadingCount > 0 && (
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            업로드 중 ({uploadingCount}개)
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-6 bg-[#eef2f7]">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
              isDragging ? "border-[#1a3a5c] bg-blue-50 scale-[1.01]" : "border-gray-300 bg-white hover:border-[#355C94] hover:bg-gray-50"
            }`}
          >
            <input ref={inputRef} type="file" multiple accept={ACCEPTED} className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />
            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? "bg-[#1a3a5c] text-white" : "bg-[#eef2f7] text-[#355C94]"
              }`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-800">파일을 드래그하거나 클릭하여 선택</p>
              <p className="text-xs text-gray-500">SVS, TIFF, NDPI, MRXS, SCN, BIF, VSI, DCM · 여러 파일 동시 선택 가능</p>
            </div>
          </div>

          {/* Mapping tools */}
          {pendingCount > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl border px-4 py-3">
              <div className="text-sm text-gray-600">
                <strong className="text-gray-800">{pendingCount}</strong>개 파일 대기 중
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadTemplate}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                  CSV 템플릿 다운로드
                </button>
                <button onClick={() => csvRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-[#1a3a5c] text-xs font-medium text-[#1a3a5c] hover:bg-blue-50 cursor-pointer transition-colors">
                  매핑 파일(CSV) 불러오기
                </button>
                <input ref={csvRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} />
              </div>
            </div>
          )}

          {/* Mapping result */}
          {mappingResult && (
            <div className={`rounded-xl border px-4 py-3 animate-in fade-in duration-300 ${
              mappingResult.matched > 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
            }`}>
              <span className={`text-sm font-medium ${mappingResult.matched > 0 ? "text-blue-800" : "text-amber-800"}`}>
                {mappingResult.matched > 0
                  ? `✓ CSV 매핑 완료: ${mappingResult.matched}개 파일에 정보가 적용되었습니다`
                  : `매핑된 파일이 없습니다. CSV의 검체번호가 파일명과 일치하는지 확인해주세요`}
              </span>
            </div>
          )}

          {/* Upload start button */}
          {pendingCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={startUpload}
                disabled={uploadingCount > 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1a3a5c] hover:bg-[#2a5a8c] disabled:opacity-50 text-white text-sm font-semibold cursor-pointer transition-colors shadow-md"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                업로드 시작 ({pendingCount}개)
              </button>
            </div>
          )}

          {/* Done summary */}
          {doneCount > 0 && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <span className="text-sm text-emerald-800 font-medium">✓ {doneCount}개 업로드 완료</span>
              <div className="flex gap-2">
                <button onClick={clearDone} className="text-xs text-emerald-600 hover:underline cursor-pointer">목록 정리</button>
                <Link href="/" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
                  대시보드에서 확인 →
                </Link>
              </div>
            </div>
          )}

          {/* File List */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="divide-y">
                {items.map((uf) => (
                  <div key={uf.id} className={`px-4 py-3 ${uf.mapped ? "bg-blue-50/50 border-l-2 border-l-blue-400" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        uf.status === "done" ? "bg-emerald-100 text-emerald-700"
                        : uf.status === "error" ? "bg-red-100 text-red-700"
                        : uf.status === "uploading" ? "bg-blue-100 text-blue-700"
                        : uf.mapped ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {getExt(uf.file.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 truncate">{uf.file.name}</span>
                          <span className="text-[11px] text-gray-400">{formatSize(uf.file.size)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-mono text-[#1a3a5c] font-semibold">{uf.specimenNo}</span>
                          {uf.mapped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">매핑됨</span>}
                          {uf.patientName && <span className="text-[11px] text-gray-700 font-medium">· {uf.patientName}</span>}
                          {uf.patientId && <span className="text-[11px] text-gray-500">({uf.patientId})</span>}
                          {uf.organ && <span className="text-[11px] text-gray-500">· {uf.organ}</span>}
                          {uf.stainType && <span className="text-[11px] text-gray-500">· {uf.stainType}</span>}
                          {uf.status === "done" && <span className="text-[11px] text-emerald-600 font-medium">✓ 완료</span>}
                          {uf.status === "error" && <span className="text-[11px] text-red-500 font-medium">✗ {uf.error}</span>}
                        </div>
                        {uf.status === "uploading" && (
                          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uf.progress}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {uf.status === "uploading" && (
                          <span className="text-xs font-bold text-blue-600 tabular-nums">{uf.progress}%</span>
                        )}
                        {uf.status === "pending" && (
                          <button onClick={() => setEditingId(editingId === uf.id ? null : uf.id)}
                            className="px-2 py-1 rounded text-[11px] text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors">
                            {editingId === uf.id ? "접기" : "편집"}
                          </button>
                        )}
                        {(uf.status === "pending" || uf.status === "error") && (
                          <button onClick={() => removeItem(uf.id)}
                            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer text-sm">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {editingId === uf.id && uf.status === "pending" && (
                      <div className="mt-3 pl-13 grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">검체번호</label>
                          <input value={uf.specimenNo} onChange={(e) => updateItem(uf.id, { specimenNo: e.target.value })}
                            className="w-full h-7 px-2 rounded border text-xs font-mono" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">환자 ID</label>
                          <input value={uf.patientId} onChange={(e) => updateItem(uf.id, { patientId: e.target.value })}
                            className="w-full h-7 px-2 rounded border text-xs" placeholder="P-2026..." />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">환자명</label>
                          <input value={uf.patientName} onChange={(e) => updateItem(uf.id, { patientName: e.target.value })}
                            className="w-full h-7 px-2 rounded border text-xs" placeholder="홍길동" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">장기</label>
                          <select value={uf.organ} onChange={(e) => updateItem(uf.id, { organ: e.target.value })}
                            className="w-full h-7 px-2 rounded border text-xs bg-white">
                            <option value="">선택</option>
                            {ORGANS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">염색</label>
                          <select value={uf.stainType} onChange={(e) => updateItem(uf.id, { stainType: e.target.value })}
                            className="w-full h-7 px-2 rounded border text-xs bg-white">
                            <option value="">선택</option>
                            {STAINS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">아직 업로드할 파일이 없습니다</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
