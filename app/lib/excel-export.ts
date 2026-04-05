import * as XLSX from 'xlsx';
import { MonthPlanning, ShiftType, Employee } from './types';

interface ExcelData {
  [key: string]: string | number;
}

export function exportPlanningToExcel(planning: MonthPlanning, employees: Employee[]): void {
  const { month, year } = planning;
  
  // Obtenir toutes les dates du mois
  const allDates: Date[] = [];
  planning.weeks.forEach(week => {
    week.days.forEach(day => {
      allDates.push(day.date);
    });
  });
  allDates.sort((a, b) => a.getTime() - b.getTime());

  // Créer les données Excel
  const excelData: ExcelData[] = [];

  // Fonction utilitaire
  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'N/A';
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  // Définir les créneaux selon le format Excel existant
  const getShiftRows = (date: Date) => {
    if (isWeekend(date)) {
      return [
        'OA Weekend',
        'Desk Matin',
        'Desk Après-midi',
        'Desk Nuit'
      ];
    } else {
      return [
        'Desk Matin',
        'OA1 Principal',
        'OA1 Secondaire',
        'OA2 Principal',
        'OA2 Secondaire',
        'OA3 Principal',
        'OA3 Secondaire',
        'Desk Après-midi',
        'Desk Nuit'
      ];
    }
  };

  // Obtenir le nombre maximum de créneaux pour toutes les dates
  const maxSlots = Math.max(...allDates.map(date => getShiftRows(date).length));

  // Créer les lignes pour chaque créneau
  for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
    const row: ExcelData = {};
    
    // Nom du créneau (première colonne)
    const firstWeekday = allDates.find(date => !isWeekend(date));
    const firstWeekend = allDates.find(date => isWeekend(date));
    
    if (firstWeekday && getShiftRows(firstWeekday)[slotIndex]) {
      row['Créneau'] = getShiftRows(firstWeekday)[slotIndex];
    } else if (firstWeekend && getShiftRows(firstWeekend)[slotIndex]) {
      row['Créneau'] = getShiftRows(firstWeekend)[slotIndex];
    } else {
      row['Créneau'] = '';
    }

    // Pour chaque date, trouver l'employé assigné à ce créneau
    allDates.forEach(date => {
      const dateKey = formatDate(date);
      const shifts = getShiftRows(date);
      const slotName = shifts[slotIndex];
      
      if (!slotName) {
        row[dateKey] = '';
        return;
      }

      // Trouver l'assignment correspondant dans le planning
      const dayAssignment = planning.weeks
        .flatMap(week => week.days)
        .find(day => day.date.toDateString() === date.toDateString());

      if (!dayAssignment) {
        row[dateKey] = '';
        return;
      }

      let assignedShift = null;

      if (slotName === 'OA Weekend') {
        assignedShift = dayAssignment.shifts.find(s => s.shiftType === ShiftType.OA_WEEKEND);
      } else if (slotName === 'Desk Matin') {
        assignedShift = dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_MORNING);
      } else if (slotName === 'Desk Après-midi') {
        assignedShift = dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_AFTERNOON);
      } else if (slotName === 'Desk Nuit') {
        assignedShift = dayAssignment.shifts.find(s => s.shiftType === ShiftType.DESK_NIGHT);
      } else if (slotName.includes('OA1 Principal')) {
        assignedShift = dayAssignment.shifts.find(s => 
          s.shiftType === ShiftType.OA_PRINCIPAL && s.oaGroupId === 'oa1'
        );
      } else if (slotName.includes('OA1 Secondaire')) {
        assignedShift = dayAssignment.shifts.find(s => 
          s.shiftType === ShiftType.OA_SECONDARY && s.oaGroupId === 'oa1'
        );
      } else if (slotName.includes('OA2 Principal')) {
        assignedShift = dayAssignment.shifts.find(s => 
          s.shiftType === ShiftType.OA_PRINCIPAL && s.oaGroupId === 'oa2'
        );
      } else if (slotName.includes('OA2 Secondaire')) {
        assignedShift = dayAssignment.shifts.find(s => 
          s.shiftType === ShiftType.OA_SECONDARY && s.oaGroupId === 'oa2'
        );
      } else if (slotName.includes('OA3 Principal')) {
        assignedShift = dayAssignment.shifts.find(s => 
          s.shiftType === ShiftType.OA_PRINCIPAL && s.oaGroupId === 'oa3'
        );
      } else if (slotName.includes('OA3 Secondaire')) {
        assignedShift = dayAssignment.shifts.find(s => 
          s.shiftType === ShiftType.OA_SECONDARY && s.oaGroupId === 'oa3'
        );
      }

      row[dateKey] = assignedShift ? getEmployeeName(assignedShift.employeeId) : '';
    });

    excelData.push(row);
  }

  // Créer le workbook
  const workbook = XLSX.utils.book_new();
  
  // Créer la feuille principale
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Nommer la feuille
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const sheetName = `${monthNames[month - 1]} ${year}`;

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Optionnel: Ajuster la largeur des colonnes
  const colWidths = [
    { wch: 15 }, // Colonne Créneau
    ...allDates.map(() => ({ wch: 12 })) // Colonnes des dates
  ];
  worksheet['!cols'] = colWidths;

  // Style des cellules d'en-tête (première ligne)
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'CCCCCC' } },
      alignment: { horizontal: 'center' }
    };
  }

  // Générer le nom de fichier
  const fileName = `Planning_${monthNames[month - 1]}_${year}.xlsx`;

  // Télécharger le fichier
  XLSX.writeFile(workbook, fileName);
}

// Fonction utilitaire pour créer une feuille de statistiques
export function createStatsSheet(planning: MonthPlanning, employees: Employee[]): any {
  const stats: any[] = [];
  
  // Calculer les statistiques par employé
  const employeeStats = new Map<string, {
    name: string;
    totalShifts: number;
    shiftsByType: Map<ShiftType, number>;
    weekendShifts: number;
    nightShifts: number;
  }>();

  // Initialiser les stats
  employees.forEach(emp => {
    employeeStats.set(emp.id, {
      name: emp.name,
      totalShifts: 0,
      shiftsByType: new Map(),
      weekendShifts: 0,
      nightShifts: 0
    });
  });

  // Compter les shifts
  planning.weeks.forEach(week => {
    week.days.forEach(day => {
      const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
      
      day.shifts.forEach(shift => {
        const empStats = employeeStats.get(shift.employeeId);
        if (empStats) {
          empStats.totalShifts++;
          
          const currentCount = empStats.shiftsByType.get(shift.shiftType) || 0;
          empStats.shiftsByType.set(shift.shiftType, currentCount + 1);
          
          if (isWeekend) {
            empStats.weekendShifts++;
          }
          
          if (shift.shiftType === ShiftType.DESK_NIGHT) {
            empStats.nightShifts++;
          }
        }
      });
    });
  });

  // Créer les données pour Excel
  employeeStats.forEach(stat => {
    stats.push({
      'Employé': stat.name,
      'Total Shifts': stat.totalShifts,
      'Desk Matin': stat.shiftsByType.get(ShiftType.DESK_MORNING) || 0,
      'Desk Après-midi': stat.shiftsByType.get(ShiftType.DESK_AFTERNOON) || 0,
      'Desk Nuit': stat.nightShifts,
      'OA Principal': stat.shiftsByType.get(ShiftType.OA_PRINCIPAL) || 0,
      'OA Secondaire': stat.shiftsByType.get(ShiftType.OA_SECONDARY) || 0,
      'OA Weekend': stat.shiftsByType.get(ShiftType.OA_WEEKEND) || 0,
      'Shifts Weekend': stat.weekendShifts,
    });
  });

  return XLSX.utils.json_to_sheet(stats);
}