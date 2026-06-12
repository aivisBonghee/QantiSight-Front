"use client";

import { useState } from "react";
import { useUploadStore } from "@/hooks/useUploadStore";
import Link from "next/link";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getExt(name: string) {
  return name.split(".").pop()?.toUpperCase() ?? "";
}

export function UploadIndicator() {
  const [open, setOpen] = useState(false);
  const items = useUploadStore((s) => s.items);
  const clearDone = useUploadStore((s) => s.clearDone);

  const uploading = items.filter((i) => i.status === "uploading");
  const pending = items.filter((i) => i.status === "pending");
  const done = items.filter((i) => i.status === "done");
  const errors = items.filter((i) => i.status === "error");
  const active = uploading.length + pending.length;

  if (items.length === 0) return null;

  const totalProgress =
    items.length > 0
      ? Math.round(
          items.reduce((s, i) => s + (i.status === "done" ? 100 : i.progress), 0) / items.length
        )
      : 0;

  return (
    <>
      {/* Header button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer transition-colors"
      >
        {active > 0 ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : errors.length > 0 ? (
          <span className="text-red-300 text-sm">!</span>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-300">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        )}
        {active > 0 ? (
          <span>{totalProgress}%</span>
        ) : (
          <span>{done.length} 완료</span>
        )}
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-4 top-12 z-50 w-96 bg-white rounded-xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b bg-[#f6f8fb] flex items-center justify-between">
              <span className="text-sm font-bold text-[#1a3a5c]">업로드 상태</span>
              <div className="flex items-center gap-2">
                {done.length > 0 && (
                  <button onClick={clearDone} className="text-[10px] text-blue-600 hover:underline cursor-pointer">
                    완료 항목 제거
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm">
                  ✕
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="px-4 py-2 border-b flex items-center gap-3 text-xs text-gray-500">
              {active > 0 && <span className="text-blue-600 font-medium">{uploading.length} 업로드중</span>}
              {pending.length > 0 && <span>{pending.length} 대기</span>}
              {done.length > 0 && <span className="text-emerald-600 font-medium">{done.length} 완료</span>}
              {errors.length > 0 && <span className="text-red-600 font-medium">{errors.length} 오류</span>}
            </div>

            {/* Items */}
            <div className="max-h-80 overflow-y-auto divide-y">
              {items.map((item) => (
                <div key={item.id} className="px-4 py-2.5 flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      item.status === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "error"
                        ? "bg-red-100 text-red-700"
                        : item.status === "uploading"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {getExt(item.file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">
                      {item.file.name}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {formatSize(item.file.size)}
                      {item.status === "done" && (
                        <span className="ml-1.5 text-emerald-600 font-medium">✓ 완료</span>
                      )}
                      {item.status === "error" && (
                        <span className="ml-1.5 text-red-500 font-medium">✗ {item.error}</span>
                      )}
                      {item.status === "uploading" && (
                        <span className="ml-1.5 text-blue-600 font-medium">{item.progress}%</span>
                      )}
                      {item.status === "pending" && (
                        <span className="ml-1.5 text-gray-400">대기중</span>
                      )}
                    </div>
                    {item.status === "uploading" && (
                      <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {done.length > 0 && (
              <div className="px-4 py-2.5 border-t bg-[#f6f8fb]">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="text-xs text-[#1a3a5c] font-semibold hover:underline"
                >
                  대시보드에서 확인 →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
