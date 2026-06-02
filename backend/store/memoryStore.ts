import type { AnalysisRecord, GeneratedOutput, WorkPlanRecord } from "../types/workMode";

const analyses = new Map<string, AnalysisRecord>();
const workPlans = new Map<string, WorkPlanRecord>();
const generatedOutputs = new Map<string, GeneratedOutput>();

export function saveAnalysis(record: AnalysisRecord) {
  analyses.set(record.analysisId, record);
  return record;
}

export function getAnalysis(analysisId: string) {
  return analyses.get(analysisId) ?? null;
}

export function getAnalysisCount() {
  return analyses.size;
}

export function saveWorkPlan(record: WorkPlanRecord) {
  workPlans.set(record.workPlanId, record);
  return record;
}

export function updateWorkPlan(record: WorkPlanRecord) {
  workPlans.set(record.workPlanId, record);
  return record;
}

export function getWorkPlan(workPlanId: string) {
  return workPlans.get(workPlanId) ?? null;
}

export function getWorkPlanCount() {
  return workPlans.size;
}

export function saveGeneratedOutput(record: GeneratedOutput) {
  generatedOutputs.set(record.answerId, record);
  return record;
}

export function getGeneratedOutput(answerId: string) {
  return generatedOutputs.get(answerId) ?? null;
}

export function getOutputsForWorkPlan(workPlanId: string) {
  return Array.from(generatedOutputs.values()).filter((output) => output.workPlanId === workPlanId);
}

export function getGeneratedOutputCount() {
  return generatedOutputs.size;
}
