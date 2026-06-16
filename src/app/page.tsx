"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { PanelLeftOpen } from "lucide-react";
import { FilterPanel } from "@/components/layout/FilterPanel";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { CaseTable } from "@/components/dashboard/CaseTable";
import { CaseDetail } from "@/components/dashboard/CaseDetail";
import { fetchCases, fetchSummary } from "@/lib/api-client";
import { useFilters } from "@/hooks/useFilters";
import type { SlideCase } from "@/types/case";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1 } },
});

const ROW_HEIGHT = 44;
const HEADER_AND_CARDS_HEIGHT = 320;

function usePageSize() {
  const [size, setSize] = useState(20);
  useEffect(() => {
    function calc() {
      const available = window.innerHeight - HEADER_AND_CARDS_HEIGHT;
      const rows = Math.max(10, Math.floor(available / ROW_HEIGHT));
      setSize(rows);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return size;
}

function Dashboard() {
  const filters = useFilters();
  const [selected, setSelected] = useState<SlideCase | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const pageSize = usePageSize();

  const filtersKey = JSON.stringify({
    search: filters.search,
    stainTypes: filters.stainTypes,
    organs: filters.organs,
    statuses: filters.statuses,
    hospitalCode: filters.hospitalCode,
    organMatch: filters.organMatch,
    stainMatch: filters.stainMatch,
    controlTissue: filters.controlTissue,
    qcGrade: filters.qcGrade,
    serverLocation: filters.serverLocation,
    hasIssue: filters.hasIssue,
    pathologist: filters.pathologist,
  });

  const sortDbMap: Record<string, string> = {
    slideId: "slide_id", patient: "patient_name", organ: "organ",
    stain: "stain_type", qc: "overall_qc_score", date: "created_at",
  };
  const sortBy = sortDbMap[sortKey] || sortKey;

  const { data: rawCasesData, isFetching, isLoading } = useQuery({
    queryKey: ["cases", filtersKey, page, sortBy, sortDir],
    queryFn: () => fetchCases(filters, page, pageSize, sortBy, sortDir),
    placeholderData: (prev) => prev,
  });

  const casesData = rawCasesData && filters.pathologist
    ? {
        ...rawCasesData,
        items: rawCasesData.items.filter((c) =>
          c.patientName.toLowerCase().includes(filters.pathologist!.toLowerCase())
        ),
      }
    : rawCasesData;

  const { data: summary } = useQuery({
    queryKey: ["summary", filtersKey],
    queryFn: () => fetchSummary(filters),
    placeholderData: (prev) => prev,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  // 필터 변경 시 1페이지로 리셋
  const prevFiltersKey = useState(filtersKey);
  if (prevFiltersKey[0] !== filtersKey) {
    prevFiltersKey[1](filtersKey);
    if (page !== 1) setPage(1);
  }

  return (
    <div className="h-full flex flex-col">
      <Header onToggleFilter={() => setFilterOpen(!filterOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop: collapsible sidebar */}
        {sidebarCollapsed ? (
          <div className="hidden lg:flex shrink-0 w-10 bg-white border-r flex-col items-center pt-3">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-[#1a3a5c] flex items-center justify-center text-gray-500 hover:text-white cursor-pointer transition-all"
              title="필터 펼치기"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="hidden lg:block shrink-0 transition-all duration-300 ease-in-out">
            <FilterPanel
              totalCount={casesData?.total ?? 0}
              onCollapse={() => setSidebarCollapsed(true)}
            />
          </div>
        )}

        {/* Mobile: slide overlay */}
        <div
          className={`
            lg:hidden absolute z-20 h-full
            transition-transform duration-200 ease-in-out
            ${filterOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <FilterPanel
            totalCount={casesData?.total ?? 0}
            onClose={() => setFilterOpen(false)}
          />
        </div>
        {filterOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-10 lg:hidden"
            onClick={() => setFilterOpen(false)}
          />
        )}

        <div className="flex-1 flex overflow-hidden min-w-0">
          <main
            className={`flex flex-col p-3 md:p-4 bg-[#eef2f7] transition-all duration-300 overflow-hidden ${
              selected ? "flex-1 min-w-0" : "flex-1"
            }`}
          >
            {/* 상단 고정 영역: 요약카드 + 검색바 */}
            <div className="shrink-0 flex flex-col gap-3 md:gap-4 w-full">
              <SummaryCards summary={summary ?? {
                totalCases: 0, organMatchRate: 0, organMismatchCount: 0,
                stainAccuracy: 0, avgLesionRatio: 0,
                lesionDistribution: { low: 0, moderate: 0, high: 0 },
                avgQcScore: 0, focusIssueCount: 0,
                controlTissueRate: 0, controlTissueMissingCount: 0,
              }} />
              <SearchBar totalCount={casesData?.total ?? 0} />
            </div>
            {/* 테이블 영역: 남은 공간 채우며 내부 스크롤 */}
            <div className="flex-1 overflow-hidden mt-3 md:mt-4 w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">데이터를 불러오는 중...</span>
                  </div>
                </div>
              ) : (
                <CaseTable
                  cases={casesData?.items ?? []}
                  total={casesData?.total ?? 0}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onSelect={(c) => setSelected(c)}
                  selectedId={selected?.id}
                  isLoading={isFetching}
                  sortBy={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              )}
            </div>
          </main>

          {selected && (
            <>
              <div
                className="fixed inset-0 bg-black/30 z-20 lg:hidden"
                onClick={() => setSelected(null)}
              />
              <aside
                className="
                  fixed right-0 top-0 h-full w-full sm:w-[400px] z-30
                  lg:relative lg:w-[420px] lg:z-auto
                  shrink-0 border-l bg-white overflow-y-auto
                  animate-in slide-in-from-right duration-300
                "
              >
                <CaseDetail
                  key={selected.id}
                  slideCase={selected}
                  onClose={() => setSelected(null)}
                />
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
