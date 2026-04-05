'use client';

import { MonthPlanning, ShiftType } from '../lib/types';
import { usePlanningStore } from '../lib/store';

interface PlanningGridProps {
  planning: MonthPlanning;
}

export default function PlanningGrid({ planning }: PlanningGridProps) {
  const { employees } = usePlanningStore();

  // Générer les couleurs pour chaque employé
  const employeeColors = new Map();
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500'
  ];
  
  employees.forEach((emp, index) => {
    employeeColors.set(emp.id, colors[index % colors.length]);
  });

  // Obtenir toutes les dates du mois
  const allDates: Date[] = [];
  planning.weeks.forEach(week => {
    week.days.forEach(day => {
      allDates.push(day.date);
    });
  });
  allDates.sort((a, b) => a.getTime() - b.getTime());

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'N/A';
  };

  const getShiftLabel = (shiftType: ShiftType) => {
    const labels = {
      [ShiftType.DESK_MORNING]: 'Desk Matin',
      [ShiftType.OA_PRINCIPAL]: 'OA Principal',
      [ShiftType.OA_SECONDARY]: 'OA Secondaire',
      [ShiftType.OA_WEEKEND]: 'OA Weekend',
      [ShiftType.DESK_AFTERNOON]: 'Desk Aprèm',
      [ShiftType.DESK_NIGHT]: 'Desk Nuit',
    };
    return labels[shiftType] || shiftType;
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Créer la grille des créneaux
  const getShiftsForDate = (date: Date) => {
    const dayAssignment = planning.weeks
      .flatMap(week => week.days)
      .find(day => day.date.toDateString() === date.toDateString());

    if (!dayAssignment) return [];

    if (isWeekend(date)) {
      // Weekend : 4 créneaux
      return [
        { type: 'OA Weekend', shift: dayAssignment.shifts.find(s => s.shiftType === ShiftType.OA_WEEKEND) },
        { type: 'Desk Matin', shift: dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_MORNING) },
        { type: 'Desk Aprèm', shift: dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_AFTERNOON) },
        { type: 'Desk Nuit', shift: dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_NIGHT) },
      ];
    } else {
      // Semaine : 9 créneaux
      const oaPrincipalShifts = dayAssignment.shifts.filter(s => s.shiftType === ShiftType.OA_PRINCIPAL);
      const oaSecondaryShifts = dayAssignment.shifts.filter(s => s.shiftType === ShiftType.OA_SECONDARY);
      
      return [
        { type: 'Desk Matin', shift: dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_MORNING) },
        { type: 'OA1 Principal', shift: oaPrincipalShifts.find(s => s.oaGroupId === 'oa1') },
        { type: 'OA1 Secondaire', shift: oaSecondaryShifts.find(s => s.oaGroupId === 'oa1') },
        { type: 'OA2 Principal', shift: oaPrincipalShifts.find(s => s.oaGroupId === 'oa2') },
        { type: 'OA2 Secondaire', shift: oaSecondaryShifts.find(s => s.oaGroupId === 'oa2') },
        { type: 'OA3 Principal', shift: oaPrincipalShifts.find(s => s.oaGroupId === 'oa3') },
        { type: 'OA3 Secondaire', shift: oaSecondaryShifts.find(s => s.oaGroupId === 'oa3') },
        { type: 'Desk Aprèm', shift: dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_AFTERNOON) },
        { type: 'Desk Nuit', shift: dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_NIGHT) },
      ];
    }
  };

  const maxSlots = Math.max(...allDates.map(date => getShiftsForDate(date).length));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* En-tête avec les dates */}
        <div className="flex border-b border-slate-600">
          <div className="w-40 p-3 bg-slate-800 font-semibold border-r border-slate-600">
            Créneaux
          </div>
          {allDates.map((date, index) => (
            <div 
              key={index} 
              className={`w-32 p-3 text-center font-semibold border-r border-slate-600 ${
                isWeekend(date) ? 'bg-slate-700' : 'bg-slate-800'
              }`}
            >
              <div className="text-sm">{formatDate(date)}</div>
            </div>
          ))}
        </div>

        {/* Grille des créneaux */}
        {Array.from({ length: maxSlots }, (_, slotIndex) => (
          <div key={slotIndex} className="flex border-b border-slate-700">
            {/* Label du créneau - prendre le premier jour non weekend pour les labels */}
            <div className="w-40 p-3 bg-slate-800 border-r border-slate-600 font-medium">
              {(() => {
                const firstWeekday = allDates.find(date => !isWeekend(date));
                if (firstWeekday) {
                  const shifts = getShiftsForDate(firstWeekday);
                  return shifts[slotIndex]?.type || '';
                }
                // Pour weekend, utiliser le premier weekend
                const firstWeekend = allDates.find(date => isWeekend(date));
                if (firstWeekend) {
                  const shifts = getShiftsForDate(firstWeekend);
                  return shifts[slotIndex]?.type || '';
                }
                return '';
              })()}
            </div>

            {/* Cellules pour chaque jour */}
            {allDates.map((date, dateIndex) => {
              const shifts = getShiftsForDate(date);
              const slotShift = shifts[slotIndex];
              
              if (!slotShift) {
                // Cellule vide pour les weekends qui ont moins de créneaux
                return (
                  <div 
                    key={dateIndex}
                    className={`w-32 p-3 border-r border-slate-600 ${
                      isWeekend(date) ? 'bg-slate-900' : 'bg-slate-950'
                    }`}
                  >
                  </div>
                );
              }

              const shift = slotShift.shift;
              if (!shift) {
                return (
                  <div 
                    key={dateIndex}
                    className={`w-32 p-3 border-r border-slate-600 ${
                      isWeekend(date) ? 'bg-slate-900' : 'bg-slate-950'
                    }`}
                  >
                    <div className="text-xs text-slate-500">Non assigné</div>
                  </div>
                );
              }

              const employeeName = getEmployeeName(shift.employeeId);
              const colorClass = employeeColors.get(shift.employeeId) || 'bg-gray-500';

              return (
                <div 
                  key={dateIndex}
                  className={`w-32 p-3 border-r border-slate-600 ${
                    isWeekend(date) ? 'bg-slate-900' : 'bg-slate-950'
                  }`}
                >
                  <div className={`px-2 py-1 rounded text-xs text-white text-center ${colorClass}`}>
                    {employeeName}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}