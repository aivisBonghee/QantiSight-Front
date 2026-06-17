const IHC_STAINS = ["HER2", "ER", "PR", "KI67"];

export function stainMatches(classification: string | undefined, caseStain: string): boolean {
  if (!classification || classification === "uncertain") return false;
  if (classification === "HE") return caseStain === "HE";
  if (classification.startsWith("IHC")) return IHC_STAINS.includes(caseStain);
  return classification === caseStain;
}
