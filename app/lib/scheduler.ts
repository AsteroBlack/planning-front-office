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
  isOAPrincipalThisWeek: boolean; // Est OA principal cette semaine
  oaPrincipalGroupId?: string; // Quel groupe OA principal cette semaine
  oaPrincipalWeeksLeft: number; // Semaines restantes en tant qu'OA principal (0, 1 ou 2)
  lastShiftDate?: Date;
}

// Tracking de la rotation OA principal
interface OAPrincipalRotation {
  // File d'attente des employés éligibles pour devenir OA principal
  queue: string[]; // employeeIds dans l'ordre de rotation
  // Employés actuellement en poste d'OA principal (max 3, un par groupe)
  currentPrincipals: Map<string, { employeeId: string; weeksServed: number }>; // groupId -> info
}

interface SchedulingState {
  employees: Map<string, EmployeeState>;
  oaPrincipalRotation: OAPrincipalRotation;
}

// Utilitaires pour dates
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
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

// Regroupe les dates par semaine (Lun-Dim)
function groupByWeek(dates: Date[]): Date[][] {
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  for (const date of dates) {
    if (date.getDay() === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(date);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  return weeks;
}

// Système de scoring pour affecter les shifts
function calculateEmployeeScore(
  employee: Employee,
  state: EmployeeState,
  shift: ShiftType,
  date: Date
): number {
  let score = 100;

  // Employee non disponible ou en congé
  if (!employee.isAvailable || employee.isOnLeave) {
    return -1000;
  }

  // Règles stagiaires
  if (employee.isIntern) {
    if (isWeekend(date)) return -1000;
    if (shift === ShiftType.OA_PRINCIPAL) return -1000;
    if (shift === ShiftType.DESK_AFTERNOON || shift === ShiftType.DESK_NIGHT) return -1000;
    if (shift === ShiftType.OA_WEEKEND) return -1000;
  }

  // En repos forcé après nuit
  if (state.daysOffAfterNight > 0) {
    return -1000;
  }

  // OA principal cette semaine → ne peut faire que OA_PRINCIPAL
  if (state.isOAPrincipalThisWeek) {
    if (!isWeekend(date) && shift !== ShiftType.OA_PRINCIPAL) return -1000;
    if (isWeekend(date)) return -1000; // OA principaux OFF le weekend
  }

  // Non-OA principal ne peut pas prendre OA_PRINCIPAL
  if (shift === ShiftType.OA_PRINCIPAL && !state.isOAPrincipalThisWeek) {
    return -1000;
  }

  // OA principal doit être sur son groupe assigné
  if (shift === ShiftType.OA_PRINCIPAL && state.oaPrincipalGroupId) {
    // Le scoring gère ça via l'appel dans assignWeekShifts
    score += 50;
  }

  // Limite de shifts par semaine (4-5)
  if (state.shiftsThisWeek >= 5) {
    return -500;
  } else if (state.shiftsThisWeek >= 4) {
    score -= 50;
  }

  // Pénalité si travaillé le même jour
  if (state.lastShiftDate) {
    const daysSinceLastShift = Math.floor(
      (date.getTime() - state.lastShiftDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceLastShift < 1) {
      return -1000;
    }
  }

  // Bonus pour équilibrer la charge
  if (state.shiftsThisWeek < 3) {
    score += 30;
  }

  // Éviter les nuits trop fréquentes
  if (shift === ShiftType.DESK_NIGHT && state.lastNightDate) {
    const daysSinceNight = Math.floor(
      (date.getTime() - state.lastNightDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceNight < 7) {
      score -= 100;
    }
  }

  return score;
}

// Sélectionne le meilleur employé pour un shift
function selectBestEmployee(
  employees: Employee[],
  availableIds: Set<string>,
  state: SchedulingState,
  shift: ShiftType,
  date: Date
): string | null {
  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const emp of employees) {
    if (!availableIds.has(emp.id)) continue;
    const empState = state.employees.get(emp.id)!;
    const score = calculateEmployeeScore(emp, empState, shift, date);
    if (score > bestScore) {
      bestScore = score;
      bestId = emp.id;
    }
  }

  return bestScore > -500 ? bestId : null;
}

// Rotation OA principal au début de chaque semaine
function rotateOAPrincipals(
  state: SchedulingState,
  oaGroups: OAGroup[],
  employees: Employee[]
): void {
  const rotation = state.oaPrincipalRotation;

  // Reset tous les états OA principal
  for (const empState of state.employees.values()) {
    empState.isOAPrincipalThisWeek = false;
    empState.oaPrincipalGroupId = undefined;
  }

  // Vérifier les OA principaux actuels
  for (const [groupId, info] of rotation.currentPrincipals) {
    info.weeksServed++;

    if (info.weeksServed >= 2) {
      // A fait ses 2 semaines → retour dans la rotation normale
      rotation.currentPrincipals.delete(groupId);
      // Ne PAS remettre dans la queue immédiatement, il revient à la fin
    }
  }

  // Réaffecter les OA principaux qui continuent leur 2e semaine
  // Ils changent de groupe pour la 2e semaine
  const continuingPrincipals: { employeeId: string; oldGroupId: string }[] = [];
  for (const [groupId, info] of rotation.currentPrincipals) {
    if (info.weeksServed === 1) {
      continuingPrincipals.push({ employeeId: info.employeeId, oldGroupId: groupId });
    }
  }

  // Groupes qui ont besoin d'un nouvel OA principal
  const groupsNeedingPrincipal = oaGroups.filter(g => !rotation.currentPrincipals.has(g.id));

  // Réaffecter les continuants à de nouveaux groupes
  for (const cont of continuingPrincipals) {
    rotation.currentPrincipals.delete(cont.oldGroupId);
    // Trouver un nouveau groupe pour cet employé
    const availableGroup = groupsNeedingPrincipal.find(g => !rotation.currentPrincipals.has(g.id));
    if (availableGroup) {
      rotation.currentPrincipals.set(availableGroup.id, {
        employeeId: cont.employeeId,
        weeksServed: 1
      });
      const idx = groupsNeedingPrincipal.indexOf(availableGroup);
      groupsNeedingPrincipal.splice(idx, 1);
    }
  }

  // Assigner de nouveaux OA principaux depuis la queue
  for (const group of groupsNeedingPrincipal) {
    if (rotation.currentPrincipals.has(group.id)) continue;

    // Chercher le prochain employé éligible dans la queue
    let assigned = false;
    for (let i = 0; i < rotation.queue.length; i++) {
      const empId = rotation.queue[i];
      const emp = employees.find(e => e.id === empId);
      const empState = state.employees.get(empId);

      if (!emp || !empState) continue;
      if (!emp.isAvailable || emp.isOnLeave || emp.isIntern) continue;
      if (empState.daysOffAfterNight > 0) continue;

      // Vérifier qu'il n'est pas déjà OA principal sur un autre groupe
      let alreadyPrincipal = false;
      for (const info of rotation.currentPrincipals.values()) {
        if (info.employeeId === empId) {
          alreadyPrincipal = true;
          break;
        }
      }
      if (alreadyPrincipal) continue;

      // Assigner
      rotation.currentPrincipals.set(group.id, {
        employeeId: empId,
        weeksServed: 0
      });
      // Retirer de la queue et remettre à la fin
      rotation.queue.splice(i, 1);
      rotation.queue.push(empId);
      assigned = true;
      break;
    }

    if (!assigned) {
      console.warn(`Pas d'employé disponible pour OA principal du groupe ${group.id}`);
    }
  }

  // Mettre à jour les états des employés assignés OA principal
  for (const [groupId, info] of rotation.currentPrincipals) {
    const empState = state.employees.get(info.employeeId);
    if (empState) {
      empState.isOAPrincipalThisWeek = true;
      empState.oaPrincipalGroupId = groupId;
    }
  }
}

// Assigne les shifts pour un jour de semaine
function assignWeekdayShifts(
  date: Date,
  employees: Employee[],
  oaGroups: OAGroup[],
  state: SchedulingState
): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const usedToday = new Set<string>();

  // 1. OA Principaux (déjà assignés pour la semaine)
  for (const group of oaGroups) {
    const principalInfo = state.oaPrincipalRotation.currentPrincipals.get(group.id);
    if (principalInfo) {
      const empState = state.employees.get(principalInfo.employeeId)!;
      // Vérifier qu'il n'est pas en repos forcé
      if (empState.daysOffAfterNight <= 0) {
        assignments.push({
          shiftType: ShiftType.OA_PRINCIPAL,
          employeeId: principalInfo.employeeId,
          oaGroupId: group.id
        });
        usedToday.add(principalInfo.employeeId);
        empState.shiftsThisWeek++;
        empState.lastShiftDate = date;
      }
    }
  }

  // 2. OA Secondaires (1 par groupe, tourne chaque jour)
  for (const group of oaGroups) {
    const available = new Set(
      employees
        .filter(e => !usedToday.has(e.id))
        .map(e => e.id)
    );
    const bestId = selectBestEmployee(employees, available, state, ShiftType.OA_SECONDARY, date);
    if (bestId) {
      assignments.push({
        shiftType: ShiftType.OA_SECONDARY,
        employeeId: bestId,
        oaGroupId: group.id
      });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
    }
  }

  // 3. Desk Matin
  {
    const available = new Set(
      employees.filter(e => !usedToday.has(e.id)).map(e => e.id)
    );
    const bestId = selectBestEmployee(employees, available, state, ShiftType.DESK_MORNING, date);
    if (bestId) {
      assignments.push({ shiftType: ShiftType.DESK_MORNING, employeeId: bestId });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
    }
  }

  // 4. Desk Après-midi
  {
    const available = new Set(
      employees.filter(e => !usedToday.has(e.id)).map(e => e.id)
    );
    const bestId = selectBestEmployee(employees, available, state, ShiftType.DESK_AFTERNOON, date);
    if (bestId) {
      assignments.push({ shiftType: ShiftType.DESK_AFTERNOON, employeeId: bestId });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
    }
  }

  // 5. Desk Nuit
  {
    const available = new Set(
      employees.filter(e => !usedToday.has(e.id)).map(e => e.id)
    );
    const bestId = selectBestEmployee(employees, available, state, ShiftType.DESK_NIGHT, date);
    if (bestId) {
      assignments.push({ shiftType: ShiftType.DESK_NIGHT, employeeId: bestId });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
      empState.daysOffAfterNight = 2;
      empState.lastNightDate = date;
    }
  }

  return assignments;
}

// Assigne les shifts pour un jour de weekend
function assignWeekendShifts(
  date: Date,
  employees: Employee[],
  state: SchedulingState
): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const usedToday = new Set<string>();

  // Les OA principaux sont OFF le weekend
  const oaPrincipalIds = new Set<string>();
  for (const info of state.oaPrincipalRotation.currentPrincipals.values()) {
    oaPrincipalIds.add(info.employeeId);
  }

  const weekendEmployees = employees.filter(e => !oaPrincipalIds.has(e.id));

  // 1. OA Weekend (1 personne couvre tous les pods)
  {
    const available = new Set(
      weekendEmployees.filter(e => !usedToday.has(e.id)).map(e => e.id)
    );
    const bestId = selectBestEmployee(weekendEmployees, available, state, ShiftType.OA_WEEKEND, date);
    if (bestId) {
      assignments.push({ shiftType: ShiftType.OA_WEEKEND, employeeId: bestId });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
    }
  }

  // 2. Desk Matin
  {
    const available = new Set(
      weekendEmployees.filter(e => !usedToday.has(e.id)).map(e => e.id)
    );
    const bestId = selectBestEmployee(weekendEmployees, available, state, ShiftType.DESK_MORNING, date);
    if (bestId) {
      assignments.push({ shiftType: ShiftType.DESK_MORNING, employeeId: bestId });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
    }
  }

  // 3. Desk Après-midi
  {
    const available = new Set(
      weekendEmployees.filter(e => !usedToday.has(e.id)).map(e => e.id)
    );
    const bestId = selectBestEmployee(weekendEmployees, available, state, ShiftType.DESK_AFTERNOON, date);
    if (bestId) {
      assignments.push({ shiftType: ShiftType.DESK_AFTERNOON, employeeId: bestId });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
    }
  }

  // 4. Desk Nuit
  {
    const available = new Set(
      weekendEmployees.filter(e => !usedToday.has(e.id)).map(e => e.id)
    );
    const bestId = selectBestEmployee(weekendEmployees, available, state, ShiftType.DESK_NIGHT, date);
    if (bestId) {
      assignments.push({ shiftType: ShiftType.DESK_NIGHT, employeeId: bestId });
      usedToday.add(bestId);
      const empState = state.employees.get(bestId)!;
      empState.shiftsThisWeek++;
      empState.lastShiftDate = date;
      empState.daysOffAfterNight = 2;
      empState.lastNightDate = date;
    }
  }

  return assignments;
}

// Met à jour l'état quotidien
function updateDailyState(state: SchedulingState, date: Date): void {
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

  // Filtrer les employés actifs
  const activeEmployees = employees.filter(e => e.isAvailable && !e.isOnLeave);

  // Initialiser l'état
  const state: SchedulingState = {
    employees: new Map(),
    oaPrincipalRotation: {
      queue: activeEmployees
        .filter(e => !e.isIntern) // Stagiaires exclus de la rotation OA principal
        .map(e => e.id),
      currentPrincipals: new Map()
    }
  };

  // Initialiser l'état de chaque employé
  for (const employee of employees) {
    state.employees.set(employee.id, {
      id: employee.id,
      shiftsThisWeek: 0,
      daysOffAfterNight: 0,
      isOAPrincipalThisWeek: false,
      oaPrincipalWeeksLeft: 0
    });
  }

  const dates = getDatesInMonth(year, month);
  const weeks: Map<number, DayAssignment[]> = new Map();
  let lastWeekNum = -1;

  // Traiter chaque jour du mois
  for (const date of dates) {
    const weekNum = getWeekNumber(date);

    // Nouvelle semaine → rotation OA principaux
    if (date.getDay() === 1 && weekNum !== lastWeekNum) {
      rotateOAPrincipals(state, oaGroups, employees);
      lastWeekNum = weekNum;
    }

    // Premier jour du mois si pas un lundi → initialiser aussi
    if (lastWeekNum === -1) {
      rotateOAPrincipals(state, oaGroups, employees);
      lastWeekNum = weekNum;
    }

    updateDailyState(state, date);

    // Assigner selon jour de semaine ou weekend
    const shifts = isWeekend(date)
      ? assignWeekendShifts(date, employees, state)
      : assignWeekdayShifts(date, employees, oaGroups, state);

    const dayAssignment: DayAssignment = {
      date: new Date(date),
      shifts
    };

    if (!weeks.has(weekNum)) {
      weeks.set(weekNum, []);
    }
    weeks.get(weekNum)!.push(dayAssignment);
  }

  // Construire les semaines de planning
  const weekPlannings: WeekPlanning[] = [];
  for (const [weekNumber, days] of weeks) {
    const sortedDays = days.sort((a, b) => a.date.getTime() - b.date.getTime());
    weekPlannings.push({
      weekNumber,
      startDate: sortedDays[0].date,
      endDate: sortedDays[sortedDays.length - 1].date,
      days: sortedDays
    });
  }

  return {
    month,
    year,
    weeks: weekPlannings.sort((a, b) => a.weekNumber - b.weekNumber)
  };
}
