import taskTemplatesData from '../../data/maintenance/task-templates.json';
import seasonalData from '../../data/maintenance/seasonal-checklists.json';
import opsTemplatesData from '../../data/ops/event-templates.json';

export interface TaskTemplate {
  id: string;
  title: string;
  matchCategories: string[];
  cadenceDays?: number;
  cadenceYears?: number;
  cadenceLabel: string;
  difficulty: number;
  diyCost?: number;
  proCost?: number;
  tools: string[];
  warnings: string[];
  whenNotToDiy: boolean;
  videoLinks: string[];
  useFilterSize: boolean;
  climateZones: string[];
  seasonHint?: string;
  asOfDate: string;
  confidence: string;
  source: string;
}

export interface SeasonalChecklist {
  id: string;
  season: string;
  climateZones: string[];
  title: string;
  gusLine: string;
  items: string[];
  asOfDate: string;
  confidence: string;
}

export interface OpsTemplate {
  id: string;
  type: string;
  title: string;
  defaultSchedule: string;
  notes?: string;
}

export function getTaskTemplates(): TaskTemplate[] {
  return taskTemplatesData.templates as TaskTemplate[];
}

export function getSeasonalChecklists(): SeasonalChecklist[] {
  return seasonalData.checklists as SeasonalChecklist[];
}

export function getOpsTemplates(): OpsTemplate[] {
  return opsTemplatesData.templates as OpsTemplate[];
}
