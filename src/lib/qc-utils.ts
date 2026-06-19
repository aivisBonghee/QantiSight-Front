const IHC_STAINS = ["IHC-HER2", "IHC-ER", "IHC-PR", "IHC-KI67"];

export function stainMatches(classification: string | undefined, caseStain: string): boolean {
  if (!classification || classification === "uncertain") return false;
  if (classification === "HE") return caseStain === "HE";
  if (classification === "IHC-nuclear") return ["IHC-ER", "IHC-PR", "IHC-KI67"].includes(caseStain);
  if (classification === "IHC-membrane") return caseStain === "IHC-HER2";
  return classification === caseStain;
}
