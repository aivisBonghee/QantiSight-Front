import type {
  SlideCase,
  QcResult,
  HospitalCode,
  StainType,
  OrganType,
  CaseStatus,
  LesionVolume,
  ServerLocation,
  DashboardSummary,
} from "@/types/case";

const SURNAMES = [
  "김","이","박","최","정","강","조","윤","장","임",
  "한","오","서","신","권","황","안","송","류","전",
  "홍","고","문","양","손","배","백","허","유","남",
  "심","노","하","곽","성","차","주","우","구","민",
  "진","엄","원","천","방","공","현","함","변","염",
];
const GIVEN_NAMES = [
  "민수","지영","현우","서연","준혁","하은","도윤","수빈","예준","지우",
  "시우","하윤","은서","지호","서준","채원","민재","다은","태현","유진",
  "승현","소연","재민","미래","건우","나연","성민","보라","인호","혜진",
];

const HOSPITALS: HospitalCode[] = ["SMC", "KUMC", "HALLYM", "SCHMC"];
const HOSPITAL_WEIGHTS = [0.3, 0.25, 0.2, 0.25];
const STAINS: StainType[] = ["HE", "IHC-HER2", "IHC-ER", "IHC-PR", "IHC-KI67"];
const ORGANS: OrganType[] = ["Breast", "Stomach", "Bladder", "Thyroid", "Colon", "Brain"];
const SERVERS: ServerLocation[] = ["server-1", "server-2", "server-3", "server-4", "server-5"];
const DIAGNOSES = [
  "Adenocarcinoma",
  "Squamous cell carcinoma",
  "Ductal carcinoma in situ",
  "Invasive ductal carcinoma",
  "Normal tissue",
  "Chronic inflammation",
  "Benign neoplasm",
  "Metastatic carcinoma",
  "Dysplasia",
  "Hyperplasia",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function gaussianRandom(rand: () => number, mean: number, std: number): number {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, Math.min(100, mean + z * std));
}

function weightedPick<T>(items: T[], weights: number[], rand: () => number): T {
  const r = rand();
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) return items[i];
  }
  return items[items.length - 1];
}

function pick<T>(items: T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

function generateQcResult(rand: () => number, diagnosis: string): QcResult {
  const focusScore = Math.round(gaussianRandom(rand, 82, 12));
  const stainQuality = Math.round(gaussianRandom(rand, 78, 15));
  const tissueCoverage = Math.round(gaussianRandom(rand, 72, 18));
  const organMatch = rand() < 0.92;
  const organConfidence = organMatch
    ? 0.85 + rand() * 0.14
    : 0.3 + rand() * 0.3;
  const stainConfidence = rand() < 0.95
    ? 0.88 + rand() * 0.11
    : 0.4 + rand() * 0.3;

  const isCancer = [
    "Adenocarcinoma",
    "Squamous cell carcinoma",
    "Ductal carcinoma in situ",
    "Invasive ductal carcinoma",
    "Metastatic carcinoma",
  ].includes(diagnosis);

  const lesionAreaRatio = isCancer ? +(rand() * 0.6 + 0.02).toFixed(3) : null;
  let lesionVolume: LesionVolume | null = null;
  if (lesionAreaRatio !== null) {
    lesionVolume =
      lesionAreaRatio < 0.1 ? "Low" : lesionAreaRatio < 0.3 ? "Moderate" : "High";
  }

  const organMatchWeight = organMatch ? 20 : 0;
  const isIHC = ["IHC-HER2", "IHC-ER", "IHC-PR", "IHC-KI67"].includes(diagnosis) || rand() > 0.4;
  const controlTissuePresent = isIHC ? rand() < 0.88 : null;
  const controlTissueConfidence = controlTissuePresent !== null
    ? +(controlTissuePresent ? 0.82 + rand() * 0.17 : 0.2 + rand() * 0.3).toFixed(2)
    : null;

  const overallQcScore = Math.round(
    focusScore * 0.3 + stainQuality * 0.3 + tissueCoverage * 0.2 + organMatchWeight
  );

  return {
    id: `qc-${Math.floor(rand() * 1e9)}`,
    focusScore,
    stainQuality,
    tissueCoverage,
    overallQcScore: Math.min(100, overallQcScore),
    organMatch,
    detectedOrgan: organMatch ? "" : pick(ORGANS, rand),
    organConfidence: +organConfidence.toFixed(2),
    stainClassification: pick(STAINS, rand),
    stainConfidence: +stainConfidence.toFixed(2),
    lesionAreaRatio,
    lesionVolume,
    controlTissuePresent,
    controlTissueConfidence,
    controlTissueStatus: isIHC ? (controlTissuePresent ? "present" : "absent") : "n/a",
    controlPieces: null,
    analyzedAt: "2026-06-03T10:00:00Z",
  };
}

function generateCases(count: number): SlideCase[] {
  const rand = seededRandom(42);
  const cases: SlideCase[] = [];

  for (let i = 0; i < count; i++) {
    const hospital = weightedPick(HOSPITALS, HOSPITAL_WEIGHTS, rand);
    const year = 24 + Math.floor(rand() * 3);

    let slideId: string;
    switch (hospital) {
      case "SMC": {
        const num = String(Math.floor(rand() * 999999)).padStart(6, "0");
        slideId = `S ${year}G${num}`;
        break;
      }
      case "KUMC": {
        const num = String(Math.floor(rand() * 999999)).padStart(6, "0");
        slideId = `S${year}${num}`;
        break;
      }
      default: {
        const num = String(Math.floor(rand() * 9999)).padStart(4, "0");
        slideId = `S-${year}-${num}`;
        break;
      }
    }

    const surname = pick(SURNAMES, rand);
    const given = pick(GIVEN_NAMES, rand);
    const patientName = `${surname}${given}`;
    const fullYear = 2000 + year;
    const patientId = `P-${fullYear}${String(Math.floor(rand() * 99999)).padStart(5, "0")}`;
    const examNo = `EX${fullYear}${String(Math.floor(rand() * 9999)).padStart(4, "0")}`;
    const month = String(Math.floor(rand() * 12) + 1).padStart(2, "0");
    const day = String(Math.floor(rand() * 28) + 1).padStart(2, "0");
    const examDate = `${fullYear}-${month}-${day}`;

    const organ = pick(ORGANS, rand);
    const stainType = pick(STAINS, rand);
    const diagnosis = pick(DIAGNOSES, rand);
    const statusRand = rand();
    const status: CaseStatus =
      statusRand < 0.1 ? "WAITING" : statusRand < 0.15 ? "PROCESSING" : statusRand < 0.18 ? "ERROR" : "DONE";
    const serverLocation = pick(SERVERS, rand);

    const qcResult = status === "DONE" ? generateQcResult(rand, diagnosis) : null;
    if (qcResult && !qcResult.organMatch) {
      qcResult.detectedOrgan = pick(
        ORGANS.filter((o) => o !== organ),
        rand
      );
    }
    if (qcResult?.organMatch) {
      qcResult.detectedOrgan = organ;
    }

    cases.push({
      id: `case-${i + 1}`,
      slideId,
      specimenNo: slideId,
      hospitalCode: hospital,
      patientId,
      patientName,
      examNo,
      examDate,
      organ,
      stainType,
      diagnosis,
      status,
      serverLocation,
      imagePath: null,
      thumbnailPath: null,
      confirmedAt: null,
      suspectedDisease: null,
      requestedStains: stainType,
      ihcMarkers: null,
      molecularTest: null,
      clinicalInfo: null,
      createdAt: examDate,
      qcResult,
      comments: [],
    });
  }

  return cases;
}

export const MOCK_CASES: SlideCase[] = generateCases(500);

export function computeSummary(cases: SlideCase[]): DashboardSummary {
  const doneCases = cases.filter((c) => c.status === "DONE" && c.qcResult);
  const totalDone = doneCases.length;

  const organMatchCount = doneCases.filter((c) => c.qcResult!.organMatch).length;
  const organMismatchCount = totalDone - organMatchCount;

  const stainCorrect = doneCases.filter(
    (c) => c.qcResult!.stainClassification === c.stainType
  ).length;

  const lesionCases = doneCases.filter((c) => c.qcResult!.lesionAreaRatio !== null);
  const avgLesionRatio =
    lesionCases.length > 0
      ? lesionCases.reduce((sum, c) => sum + c.qcResult!.lesionAreaRatio!, 0) / lesionCases.length
      : 0;

  const lesionDistribution = { low: 0, moderate: 0, high: 0 };
  lesionCases.forEach((c) => {
    const v = c.qcResult!.lesionVolume!;
    if (v === "Low") lesionDistribution.low++;
    else if (v === "Moderate") lesionDistribution.moderate++;
    else lesionDistribution.high++;
  });

  const avgQcScore =
    totalDone > 0
      ? doneCases.reduce((sum, c) => sum + c.qcResult!.overallQcScore, 0) / totalDone
      : 0;

  const focusIssueCount = doneCases.filter((c) => c.qcResult!.focusScore < 60).length;

  const controlCases = doneCases.filter((c) => c.qcResult!.controlTissuePresent !== null);
  const controlPresentCount = controlCases.filter((c) => c.qcResult!.controlTissuePresent).length;
  const controlTissueRate = controlCases.length > 0 ? (controlPresentCount / controlCases.length) * 100 : 0;
  const controlTissueMissingCount = controlCases.length - controlPresentCount;

  return {
    totalCases: cases.length,
    organMatchRate: totalDone > 0 ? (organMatchCount / totalDone) * 100 : 0,
    organMismatchCount,
    stainAccuracy: totalDone > 0 ? (stainCorrect / totalDone) * 100 : 0,
    avgLesionRatio,
    lesionDistribution,
    avgQcScore,
    focusIssueCount,
    controlTissueRate,
    controlTissueMissingCount,
  };
}
