'use client';

import { useState } from 'react';
import { usePlanningStore } from '../lib/store';
import { generateMonthPlanning } from '../lib/scheduler';
import { exportPlanningToExcel } from '../lib/excel-export';
import PlanningGrid from '../components/PlanningGrid';

export default function GeneratePage() {
  const { employees, oaGroups, setPlanning, currentPlanning } = usePlanningStore();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPlanning, setPreviewPlanning] = useState<any>(null);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

  const availableEmployees = employees.filter(emp => emp.isAvailable && !emp.isOnLeave);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Simulation d'un délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const config = {
        employees: availableEmployees,
        oaGroups,
        month: selectedMonth,
        year: selectedYear,
      };

      const planning = generateMonthPlanning(config);
      setPreviewPlanning(planning);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du planning');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlanning = () => {
    if (previewPlanning) {
      setPlanning(previewPlanning);
      alert('Planning sauvegardé !');
    }
  };

  const handleExportExcel = () => {
    if (previewPlanning) {
      exportPlanningToExcel(previewPlanning, employees);
    }
  };

  const formatMonthYear = (month: number, year: number) => {
    return `${months[month - 1]} ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Générer Planning</h1>
        <p className="text-slate-400 mt-1">
          Créez automatiquement un planning mensuel pour votre équipe
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Paramètres</h2>
          
          <div className="space-y-4">
            {/* Sélection mois/année */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mois
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Année
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Période sélectionnée */}
            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-sm font-medium text-slate-300 mb-1">Période sélectionnée :</p>
              <p className="text-lg font-semibold text-white">
                {formatMonthYear(selectedMonth, selectedYear)}
              </p>
            </div>

            {/* Bouton de génération */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || availableEmployees.length < 4}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Génération en cours...</span>
                </div>
              ) : (
                '🎯 Générer le Planning'
              )}
            </button>

            {availableEmployees.length < 4 && (
              <div className="p-3 bg-red-950 border border-red-800 rounded-lg">
                <p className="text-red-200 text-sm">
                  ⚠️ Au moins 4 employés disponibles sont nécessaires pour générer un planning.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* État de l'équipe */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">État de l'Équipe</h2>
          
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-900 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{availableEmployees.length}</div>
                <div className="text-sm text-green-200">Disponibles</div>
              </div>
              <div className="text-center p-3 bg-red-900 rounded-lg">
                <div className="text-2xl font-bold text-red-400">
                  {employees.length - availableEmployees.length}
                </div>
                <div className="text-sm text-red-200">Indisponibles</div>
              </div>
            </div>

            {/* Liste des disponibles */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Employés disponibles :</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center space-x-2 p-2 bg-slate-700 rounded">
                    <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {emp.name.charAt(0)}
                    </span>
                    <span className="text-white text-sm">{emp.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration OA */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Groupes OA configurés :</p>
              <div className="space-y-1">
                {oaGroups.map(group => (
                  <div key={group.id} className="text-sm text-slate-300 p-2 bg-slate-700 rounded">
                    <span className="font-medium">{group.name}</span> : {group.pods.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prévisualisation */}
      {previewPlanning && (
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Prévisualisation</h2>
                <p className="text-sm text-slate-400">
                  Planning pour {formatMonthYear(previewPlanning.month, previewPlanning.year)}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSavePlanning}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✅ Valider et Sauvegarder
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📊 Exporter Excel
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <PlanningGrid planning={previewPlanning} />
          </div>
        </div>
      )}

      {/* Planning actuel */}
      {currentPlanning && !previewPlanning && (
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">Planning Actuel</h2>
                <p className="text-sm text-slate-400">
                  {formatMonthYear(currentPlanning.month, currentPlanning.year)}
                </p>
              </div>
              
              <div className="text-sm text-slate-400">
                Générez un nouveau planning pour remplacer celui-ci
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <PlanningGrid planning={currentPlanning} />
          </div>
        </div>
      )}
    </div>
  );
}