import { create } from "zustand";

export interface UploadItem {
  id: string;
  file: File;
  slideId: string;
  specimenNo: string;
  patientId: string;
  patientName: string;
  organ: string;
  stainType: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  caseId?: string;
  error?: string;
  mapped?: boolean;
}

interface UploadStore {
  items: UploadItem[];
  concurrency: number;
  activeCount: number;

  addFiles: (files: File[]) => void;
  removeItem: (id: string) => void;
  clearDone: () => void;
  updateItem: (id: string, patch: Partial<UploadItem>) => void;
  startUpload: () => void;
  applyMapping: (mapping: Map<string, Partial<UploadItem>>) => { matched: number; total: number };
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseSpecimen(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  items: [],
  concurrency: 5,
  activeCount: 0,

  addFiles: (files) => {
    const newItems: UploadItem[] = files.map((f) => ({
      id: generateId(),
      file: f,
      slideId: "",
      specimenNo: parseSpecimen(f.name),
      patientId: "",
      patientName: "",
      organ: "",
      stainType: "",
      progress: 0,
      status: "pending" as const,
    }));
    set((s) => ({ items: [...s.items, ...newItems] }));
  },

  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  clearDone: () => set((s) => ({ items: s.items.filter((i) => i.status !== "done") })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),

  applyMapping: (mapping) => {
    let matched = 0;
    set((s) => ({
      items: s.items.map((item) => {
        if (item.status !== "pending") return item;
        const match = mapping.get(item.specimenNo);
        if (match) {
          matched++;
          return {
            ...item,
            mapped: true,
            patientId: match.patientId || item.patientId,
            patientName: match.patientName || item.patientName,
            organ: match.organ || item.organ,
            stainType: match.stainType || item.stainType,
          };
        }
        return item;
      }),
    }));
    return { matched, total: mapping.size };
  },

  startUpload: () => {
    const state = get();
    const available = state.concurrency - state.activeCount;
    if (available <= 0) return;

    const pending = state.items.filter((i) => i.status === "pending");
    const toStart = pending.slice(0, available);
    if (toStart.length === 0) return;

    set((s) => ({ activeCount: s.activeCount + toStart.length }));

    for (const item of toStart) {
      get().updateItem(item.id, { status: "uploading", progress: 0 });
      uploadSingle(item, get);
    }
  },
}));

function uploadSingle(
  item: UploadItem,
  get: () => UploadStore,
) {
  const formData = new FormData();
  formData.append("file", item.file);
  if (item.patientId) formData.append("patient_id", item.patientId);
  if (item.patientName) formData.append("patient_name", item.patientName);
  if (item.organ) formData.append("organ", item.organ);
  if (item.stainType) formData.append("stain_type", item.stainType);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      get().updateItem(item.id, { progress: pct });
    }
  });

  xhr.addEventListener("load", () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const res = JSON.parse(xhr.responseText);
        get().updateItem(item.id, {
          status: "done",
          progress: 100,
          caseId: res.case_id,
          slideId: res.slide_id,
        });
      } catch {
        get().updateItem(item.id, { status: "done", progress: 100 });
      }
    } else {
      get().updateItem(item.id, { status: "error", error: `HTTP ${xhr.status}` });
    }
    onComplete(get);
  });

  xhr.addEventListener("error", () => {
    get().updateItem(item.id, { status: "error", error: "네트워크 오류" });
    onComplete(get);
  });

  xhr.open("POST", "/api/upload");
  xhr.send(formData);
}

function onComplete(get: () => UploadStore) {
  const store = get();
  useUploadStore.setState({ activeCount: Math.max(0, store.activeCount - 1) });
  setTimeout(() => get().startUpload(), 50);
}
