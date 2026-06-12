"use client";

import { useState, useEffect, useRef } from "react";
import { useFilters } from "@/hooks/useFilters";

interface Props {
  totalCount: number;
}

export function SearchBar({ totalCount }: Props) {
  const search = useFilters((s) => s.search);
  const setSearch = useFilters((s) => s.setSearch);
  const [local, setLocal] = useState(search);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(search);
  }, [search]);

  const handleChange = (value: string) => {
    setLocal(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearch(value);
    }, 400);
  };

  const handleClear = () => {
    setLocal("");
    clearTimeout(timerRef.current);
    setSearch("");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          placeholder="슬라이드 ID, 환자명, 진단명으로 검색..."
          value={local}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#355C94]/30 focus:border-[#355C94] transition-all"
        />
        {local && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-500 text-xs cursor-pointer transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      <span className="text-[13px] text-gray-500 shrink-0">
        검색 결과 <strong className="text-gray-800">{totalCount}</strong>건
      </span>
    </div>
  );
}
