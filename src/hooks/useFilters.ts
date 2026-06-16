import { create } from "zustand";
import type {
  CaseFilters,
  StainType,
  OrganType,
  CaseStatus,
  OrganMatchFilter,
  ControlTissueFilter,
  QcGrade,
  ServerLocation,
} from "@/types/case";

interface FilterState extends CaseFilters {
  toggleStain: (s: StainType) => void;
  toggleOrgan: (o: OrganType) => void;
  toggleStatus: (s: CaseStatus) => void;
  setSearch: (q: string) => void;
  setOrganMatch: (v: OrganMatchFilter | null) => void;
  setStainMatch: (v: OrganMatchFilter | null) => void;
  setControlTissue: (v: ControlTissueFilter | null) => void;
  setQcGrade: (v: QcGrade | null) => void;
  setServerLocation: (v: ServerLocation | null) => void;
  toggleHasIssue: () => void;
  setPathologist: (v: string | null) => void;
  reset: () => void;
}

const initial: CaseFilters = {
  stainTypes: [],
  organs: [],
  statuses: [],
  hospitalCode: null,
  search: "",
  organMatch: null,
  stainMatch: null,
  controlTissue: null,
  qcGrade: null,
  serverLocation: null,
  hasIssue: false,
  pathologist: null,
};

export const useFilters = create<FilterState>((set) => ({
  ...initial,
  toggleStain: (s) =>
    set((state) => ({
      stainTypes: state.stainTypes.includes(s)
        ? state.stainTypes.filter((x) => x !== s)
        : [...state.stainTypes, s],
    })),
  toggleOrgan: (o) =>
    set((state) => ({
      organs: state.organs.includes(o)
        ? state.organs.filter((x) => x !== o)
        : [...state.organs, o],
    })),
  toggleStatus: (s) =>
    set((state) => ({
      statuses: state.statuses.includes(s)
        ? state.statuses.filter((x) => x !== s)
        : [...state.statuses, s],
    })),
  setSearch: (q) => set({ search: q }),
  setOrganMatch: (v) => set((s) => ({ organMatch: s.organMatch === v ? null : v })),
  setStainMatch: (v) => set((s) => ({ stainMatch: s.stainMatch === v ? null : v })),
  setControlTissue: (v) => set((s) => ({ controlTissue: s.controlTissue === v ? null : v })),
  setQcGrade: (v) => set((s) => ({ qcGrade: s.qcGrade === v ? null : v })),
  setServerLocation: (v) => set((s) => ({ serverLocation: s.serverLocation === v ? null : v })),
  toggleHasIssue: () => set((s) => ({ hasIssue: !s.hasIssue })),
  setPathologist: (v) => set({ pathologist: v }),
  reset: () => set(initial),
}));
