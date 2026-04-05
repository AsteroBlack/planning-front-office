import {
  Employee,
  Pod,
  OAGroup,
  ShiftType,
  DayAssignment,
  ShiftAssignment,
  WeekPlanning,
  MonthPlanning,
  PlanningConfig
} from './types';

// État de tracking pour le moteur
interface EmployeeState {
  id: string;
  shiftsThisWeek: number;
  daysOffAfterNight: number; // Jours restants de repos après nuit
  lastNightDate?: Date;
  currentOAGroup?: string; // Pour rotation OA principal
  oaRotationWeek: number; // Semaine dans le cycle de rotation OA
  lastShiftDate?: Date;
}

interface SchedulingState {
  employees: Map<string, EmployeeState>;
  oaGroupRotation: Map<string, number>; // employeeId -> index du groupe OA actuel
}

// Utilitaires pour dates
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Dimanche ou Samedi
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

function getDatesInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

// Système de scoring pour affecter les shifts
function calculateEmployeeScore(
  employee: Employee,
  state: EmployeeState,
  shift: ShiftType,
  date: Date,
  oaGroupId?: string
): number {
  let score = 100;

  // Employee non disponible ou en congé
  if (!employee.isAvailable || employee.isOnLeave) {
    return -1000;
  }

  // En repos forcé après nuit
  if (state.daysOffAfterNight > 0) {
    return -500;
  }

  // Limite de shifts par semaine (4-5)
  if (state.shiftsThisWeek >= 5) {
    score -= 200;
  } else if (state.shiftsThisWeek >= 4) {
    score -= 50;
  }

  // Pénalité si travaillé récemment
  if (state.lastShiftDate) {
    const daysSinceLastShift = Math.floor(
      (date.getTime() - state.lastShiftDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceLastShift < 1) {
      score -= 300; // Pas deux shifts consécutifs le même jour
    } else if (daysSinceLastShift === 1) {
      score -= 50; // Préférer un jour de repos
    }
  }

  // Bonus pour équilibrer la charge
  if (state.shiftsThisWeek < 3) {
    score += 30;
  }

  // Logique spécifique par type de shift
  if (shift === ShiftType.OA_PRINCIPAL) {
    if (isWeekend(date)) {
      return -1000; // OA principaux OFF le weekend
    }
    
    // Rotation des groupes OA
    if (state.currentOAGroup && state.currentOAGroup !== oaGroupId) {
      score -= 100; // Préférer continuer avec le même groupe pendant la semaine
    }
  }

  if (shift === ShiftType.DESK_NIGHT) {
    // Éviter les nuits trop fréquentes
    if (state.lastNightDate) {
      const daysSinceNight = Math.floor(
        (date.getTime() - state.lastNightDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysSinceNight < 7) {
        score -= 100;
      }
    }
  }

  return score;
}

// Crée les shifts requis pour un jour donné
function getRequiredShifts(date: Date, oaGroups: OAGroup[]): ShiftType[] {
  if (isWeekend(date)) {
    // Weekend: 4 postes
    return [
      ShiftType.OA_WEEKEND,
      ShiftType.DESK_MORNING,
      ShiftType.DESK_AFTERNOON,
      ShiftType.DESK_NIGHT
    ];
  } else {
    // Semaine: 9 postes
    return [
      ShiftType.DESK_MORNING,
      ShiftType.OA_PRINCIPAL, // x3 pour les 3 groupes
      ShiftType.OA_PRINCIPAL,
      ShiftType.OA_PRINCIPAL,
      ShiftType.OA_SECONDARY, // x3 pour les 3 groupes
      ShiftType.OA_SECONDARY,
      ShiftType.OA_SECONDARY,
      ShiftType.DESK_AFTERNOON,
      ShiftType.DESK_NIGHT
    ];
  }
}

// Assigne les shifts pour un jour
function assignDayShifts(
  date: Date,
  employees: Employee[],
  oaGroups: OAGroup[],
  state: SchedulingState
): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const requiredShifts = getRequiredShifts(date, oaGroups);
  const availableEmployees = [...employees];

  // Grouper les shifts OA par type
  const oaPrincipalShifts = requiredShifts.filter(s => s === ShiftType.OA_PRINCIPAL);
  const oaSecondaryShifts = requiredShifts.filter(s => s === ShiftType.OA_SECONDARY);
  const otherShifts = requiredShifts.filter(s => 
    s !== ShiftType.OA_PRINCIPAL && s !== ShiftType.OA_SECONDARY
  );

  // Assigner OA Principaux avec rotation des groupes
  for (let i = 0; i < oaPrincipalShifts.length && i < oaGroups.length; i++) {
    const oaGroup = oaGroups[i];
    const shift = oaPrincipalShifts[i];

    let bestEmployee: Employee | null = null;
    let bestScore = -Infinity;

    for (const employee of availableEmployees) {
      const empState = state.employees.get(employee.id)!;
      const score = calculateEmployeeScore(employee, empState, shift, date, oaGroup.id);

      if (score > bestScore) {
        bestScore = score;
        bestEmployee = employee;
      }
    }

    if (bestEmployee) {
      assignments.push({
        shiftType: shift,
        employeeId: bestEmployee.id,
        oaGroupId: oaGroup.id
      });

      // Mettre à jour l'état
      const empState = state.employees.get(bestEmployee.id)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
      empState.currentOAGroup = oaGroup.id;

      // Retirer de la liste disponible
      const index = availableEmployees.indexOf(bestEmployee);
      availableEmployees.splice(index, 1);
    }
  }

  // Assigner OA Secondaires
  for (let i = 0; i < oaSecondaryShifts.length; i++) {
    const shift = oaSecondaryShifts[i];
    const oaGroup = oaGroups[i % oaGroups.length]; // Rotation circulaire

    let bestEmployee: Employee | null = null;
    let bestScore = -Infinity;

    for (const employee of availableEmployees) {
      const empState = state.employees.get(employee.id)!;
      const score = calculateEmployeeScore(employee, empState, shift, date, oaGroup.id);

      if (score > bestScore) {
        bestScore = score;
        bestEmployee = employee;
      }
    }

    if (bestEmployee) {
      assignments.push({
        shiftType: shift,
        employeeId: bestEmployee.id,
        oaGroupId: oaGroup.id
      });

      // Mettre à jour l'état
      const empState = state.employees.get(bestEmployee.id)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;

      // Retirer de la liste disponible
      const index = availableEmployees.indexOf(bestEmployee);
      availableEmployees.splice(index, 1);
    }
  }

  // Assigner les autres shifts
  for (const shift of otherShifts) {
    let bestEmployee: Employee | null = null;
    let bestScore = -Infinity;

    for (const employee of availableEmployees) {
      const empState = state.employees.get(employee.id)!;
      const score = calculateEmployeeScore(employee, empState, shift, date);

      if (score > bestScore) {
        bestScore = score;
        bestEmployee = employee;
      }
    }

    if (bestEmployee) {
      assignments.push({
        shiftType: shift,
        employeeId: bestEmployee.id
      });

      // Mettre à jour l'état
      const empState = state.employees.get(bestEmployee.id)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;

      // Si c'est une nuit, programmer 2 jours de repos
      if (shift === ShiftType.DESK_NIGHT) {
        empState.daysOffAfterNight = 2;
        empState.lastNightDate = date;
      }

      // Retirer de la liste disponible
      const index = availableEmployees.indexOf(bestEmployee);
      availableEmployees.splice(index, 1);
    }
  }

  return assignments;
}

// Met à jour l'état quotidien
function updateDailyState(state: SchedulingState, date: Date): void {
  // Décrémenter les jours de repos après nuit
  for (const empState of state.employees.values()) {
    if (empState.daysOffAfterNight > 0) {
      empState.daysOffAfterNight--;
    }
  }

  // Reset compteur shifts si c'est lundi
  if (date.getDay() === 1) {
    for (const empState of state.employees.values()) {
      empState.shiftsThisWeek = 0;
    }
  }
}

// Fonction principale de génération du planning
export function generateMonthPlanning(config: PlanningConfig): MonthPlanning {
  const { employees, oaGroups, month, year } = config;

  // Initialiser l'état
  const state: SchedulingState = {
    employees: new Map(),
    oaGroupRotation: new Map()
  };

  // Initialiser l'état de chaque employé
  for (const employee of employees) {
    state.employees.set(employee.id, {
      id: employee.id,
      shiftsThisWeek: 0,
      daysOffAfterNight: 0,
      oaRotationWeek: 0
    });
  }

  const dates = getDatesInMonth(year, month);
  const weeks: Map<number, DayAssignment[]> = new Map();

  // Traiter chaque jour du mois
  for (const date of dates) {
    updateDailyState(state, date);
    
    const shifts = assignDayShifts(date, employees, oaGroups, state);
    const dayAssignment: DayAssignment = {
      date: new Date(date),
      shifts
    };

    const weekNum = getWeekNumber(date);
    if (!weeks.has(weekNum)) {
      weeks.set(weekNum, []);
    }
    weeks.get(weekNum)!.push(dayAssignment);
  }

  // Construire les semaines de planning
  const weekPlannings: WeekPlanning[] = [];
  for (const [weekNumber, days] of weeks) {
    const sortedDays = days.sort((a, b) => a.date.getTime() - b.date.getTime());
    const startDate = sortedDays[0].date;
    const endDate = sortedDays[sortedDays.length - 1].date;

    weekPlannings.push({
      weekNumber,
      startDate,
      endDate,
      days: sortedDays
    });
  }

  return {
    month,
    year,
    weeks: weekPlannings.sort((a, b) => a.weekNumber - b.weekNumber)
  };
}