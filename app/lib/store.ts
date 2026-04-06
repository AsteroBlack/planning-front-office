import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Employee, OAGroup, Pod, MonthPlanning } from './types';

interface PlanningStore {
  employees: Employee[];
  oaGroups: OAGroup[];
  currentPlanning: MonthPlanning | null;
  
  // Actions
  addEmployee: (name: string) => void;
  removeEmployee: (id: string) => void;
  toggleLeave: (id: string) => void;
  toggleAvailable: (id: string) => void;
  updateOAGroups: (groups: OAGroup[]) => void;
  setPlanning: (planning: MonthPlanning) => void;
  clearPlanning: () => void;
}

// Employés par défaut depuis SPEC.md
const defaultEmployees: Employee[] = [
  { id: '1', name: 'RODRIC', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '2', name: 'MARIAM', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '3', name: 'MICHELLE', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '4', name: 'FREDERIC', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '5', name: 'AYMARD', isAvailable: true, isOnLeave: false, isIntern: true },
  { id: '6', name: 'BOSSOU', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '7', name: 'ASSALE', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '8', name: 'HILLI', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '9', name: 'EMMANUEL', isAvailable: true, isOnLeave: false, isIntern: true },
  { id: '10', name: 'CHRISTOPHER', isAvailable: true, isOnLeave: false, isIntern: false },
  { id: '11', name: 'ANNA-MURIELLE', isAvailable: true, isOnLeave: false, isIntern: false },
];

// Groupes OA par défaut depuis SPEC.md
const defaultOAGroups: OAGroup[] = [
  { 
    id: 'oa1', 
    name: 'OA1',
    pods: [Pod.WECA, Pod.WEA]
  },
  { 
    id: 'oa2', 
    name: 'OA2',
    pods: [Pod.MS]
  },
  { 
    id: 'oa3', 
    name: 'OA3',
    pods: [Pod.B2B, Pod.MENA, Pod.ACE]
  }
];

export const usePlanningStore = create<PlanningStore>()(
  devtools(
    (set, get) => ({
      employees: defaultEmployees,
      oaGroups: defaultOAGroups,
      currentPlanning: null,

      addEmployee: (name: string) => {
        const newEmployee: Employee = {
          id: Date.now().toString(),
          name: name.toUpperCase(),
          isAvailable: true,
          isOnLeave: false,
          isIntern: false,
        };
        set((state) => ({
          employees: [...state.employees, newEmployee],
        }));
      },

      removeEmployee: (id: string) => {
        set((state) => ({
          employees: state.employees.filter(emp => emp.id !== id),
        }));
      },

      toggleLeave: (id: string) => {
        set((state) => ({
          employees: state.employees.map(emp => 
            emp.id === id 
              ? { ...emp, isOnLeave: !emp.isOnLeave }
              : emp
          ),
        }));
      },

      toggleAvailable: (id: string) => {
        set((state) => ({
          employees: state.employees.map(emp => 
            emp.id === id 
              ? { ...emp, isAvailable: !emp.isAvailable }
              : emp
          ),
        }));
      },

      updateOAGroups: (groups: OAGroup[]) => {
        set({ oaGroups: groups });
      },

      setPlanning: (planning: MonthPlanning) => {
        set({ currentPlanning: planning });
      },

      clearPlanning: () => {
        set({ currentPlanning: null });
      },
    }),
    {
      name: 'planning-store',
    }
  )
);