export { computeTotalsFromLineItems, validateFinancialData, reconcileFinancialData } from "./extractionValidation.mjs";

export interface ValidationCheckResult {
  id: string;
  section: string;
  labelEn: string;
  labelAr: string;
  passed: boolean;
  status: 'passed' | 'mismatch' | 'skipped' | string;
  computedValue: number | null;
  printedValue: number | null;
  difference: number | null;
  pctDiff: number | null;
  toleranceDescription: string;
  pageNumber?: number | null;
  detail: string;
}

export interface ValidationSummary {
  allPassed: boolean;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  totalDifference: number;
  failingSections: string[];
  checks: ValidationCheckResult[];
  computedTotals: any;
  pass2Attempted?: boolean;
  pass2Improved?: boolean;
}
