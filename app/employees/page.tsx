'use client';

import { useState } from 'react';
import { usePlanningStore } from '../lib/store';

export default function EmployeesPage() {
  const { 
    employees, 
    addEmployee, 
    removeEmployee, 
    toggleLeave, 
    toggleAvailable 
  } = usePlanningStore();
  
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddEmployee = () => {
    if (newEmployeeName.trim()) {
      addEmployee(newEmployeeName.trim());
      setNewEmployeeName('');
      setShowAddForm(false);
    }
  };

  const availableCount = employees.filter(emp => emp.isAvailable && !emp.isOnLeave).length;
  const onLeaveCount = employees.filter(emp => emp.isOnLeave).length;
  const unavailableCount = employees.filter(emp => !emp.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Employés</h1>
          <p className="text-slate-400 mt-1">
            Gérez votre équipe et leurs disponibilités
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Ajouter Employé
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👥</span>
            <div>
              <h3 className="font-semibold text-white">Total</h3>
              <p className="text-2xl font-bold text-white">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-white">Disponibles</h3>
              <p className="text-2xl font-bold text-green-400">{availableCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏖️</span>
            <div>
              <h3 className="font-semibold text-white">En Congé</h3>
              <p className="text-2xl font-bold text-yellow-400">{onLeaveCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="font-semibold text-white">Indisponibles</h3>
              <p className="text-2xl font-bold text-red-400">{unavailableCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Nouvel Employé</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="Nom de l'employé"
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddEmployee()}
            />
            <button
              onClick={handleAddEmployee}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewEmployeeName('');
              }}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des employés */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Liste des Employés</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-left p-4 font-semibold text-white">Nom</th>
                <th className="text-center p-4 font-semibold text-white">Statut</th>
                <th className="text-center p-4 font-semibold text-white">Disponibilité</th>
                <th className="text-center p-4 font-semibold text-white">Congé</th>
                <th className="text-center p-4 font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-slate-700 hover:bg-slate-750">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {employee.name.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{employee.name}</span>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    {employee.isOnLeave ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-600 text-white rounded-full text-xs">
                        <span>🏖️</span>
                        <span>En congé</span>
                      </span>
                    ) : employee.isAvailable ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-full text-xs">
                        <span>✅</span>
                        <span>Disponible</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded-full text-xs">
                        <span>❌</span>
                        <span>Indisponible</span>
                      </span>
                    )}
                  </td>
                  
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleAvailable(employee.id)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        employee.isAvailable 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        employee.isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleLeave(employee.id)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        employee.isOnLeave 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        employee.isOnLeave ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  
                  <td className="p-4 text-center">
                    <button
                      onClick={() => removeEmployee(employee.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {employees.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Aucun employé enregistré
            </div>
          )}
        </div>
      </div>
    </div>
  );
}