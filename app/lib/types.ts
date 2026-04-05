// Types pour le système de planification

export interface Employee {
  id: string;
  name: string;
  isAvailable: boolean;
  isOnLeave: boolean;
}

export enum Pod {
  WEA = "WEA",
  WECA = "WECA", 
  MENA = "MENA",
  ACE = "ACE",
  MS = "MS",
  B2B = "B2B"
}

export interface OAGroup {
  id: string;
  name: string;
  pods: Pod[];
}

export enum ShiftType {
  DESK_MORNING = "DESK_MORNING",
  DESK_AFTERNOON = "DESK_AFTERNOON", 
  DESK_NIGHT = "DESK_NIGHT",
  OA_PRINCIPAL = "OA_PRINCIPAL",
  OA_SECONDARY = "OA_SECONDARY",
  OA_WEEKEND = "OA_WEEKEND"
}

export interface ShiftAssignment {
  shiftType: ShiftType;
  employeeId: string;
  oaGroupId?: string; // Pour les OA assignments
}

export interface DayAssignment {
  date: Date;
  shifts: ShiftAssignment[];
}

export interface WeekPlanning {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: DayAssignment[];
}

export interface MonthPlanning {
  month: number;
  year: number;
  weeks: WeekPlanning[];
}

export interface PlanningConfig {
  employees: Employee[];
  oaGroups: OAGroup[];
  month: number;
  year: number;
}