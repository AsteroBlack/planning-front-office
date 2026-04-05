'use client';

import { usePlanningStore } from './lib/store';
import { exportPlanningToExcel } from './lib/excel-export';
import PlanningGrid from './components/PlanningGrid';
import Link from 'next/link';

export default function Dashboard() {
  const { currentPlanning, employees } = usePlanningStore();
  
  const handleExportExcel = () => {
    if (currentPlanning) {
      exportPlanningToExcel(currentPlanning, employees);
    }
  };

  const formatMonthYear = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return new Intl.DateTimeFormat('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Vue d'ensemble du planning front office
          </p>
        </div>
        
        {currentPlanning && (
          <div className="text-right">
            <h2 className="text-xl font-semibold text-white">
              {formatMonthYear(currentPlanning.month, currentPlanning.year)}
            </h2>
            <p className="text-sm text-slate-400">
              {currentPlanning.weeks.length} semaines • {' '}
              {currentPlanning.weeks.reduce((acc, week) => acc + week.days.length, 0)} jours
            </p>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      {currentPlanning ? (
        <div className="space-y-6">
          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-semibold text-white">Planning Actuel</h3>
                  <p className="text-sm text-slate-400">
                    {formatMonthYear(currentPlanning.month, currentPlanning.year)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-semibold text-white">Total Shifts</h3>
                  <p className="text-sm text-slate-400">
                    {currentPlanning.weeks.reduce(
                      (acc, week) => acc + week.days.reduce(
                        (dayAcc, day) => dayAcc + day.shifts.length, 0
                      ), 0
                    )} affectations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-semibold text-white">Statut</h3>
                  <p className="text-sm text-green-400">Planning généré</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grille de planning */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  Planning Mensuel
                </h2>
                <div className="flex space-x-2">
                  <Link 
                    href="/generate"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Régénérer
                  </Link>
                  <button 
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Exporter Excel
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <PlanningGrid planning={currentPlanning} />
            </div>
          </div>
        </div>
      ) : (
        /* État vide */
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-6">📅</div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Aucun Planning Généré
            </h2>
            <p className="text-slate-400 mb-8">
              Commencez par générer un planning mensuel pour visualiser 
              les affectations des équipes front office.
            </p>
            <Link 
              href="/generate"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>🎯</span>
              <span>Générer un Planning</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}