'use client';

import { useState } from 'react';
import { usePlanningStore } from '../lib/store';
import { Pod, OAGroup } from '../lib/types';

export default function SettingsPage() {
  const { oaGroups, updateOAGroups } = usePlanningStore();
  const [editingGroups, setEditingGroups] = useState<OAGroup[]>(oaGroups);

  const allPods = Object.values(Pod);

  const handlePodToggle = (groupId: string, pod: Pod) => {
    setEditingGroups(groups => 
      groups.map(group => {
        if (group.id === groupId) {
          const currentPods = group.pods;
          const newPods = currentPods.includes(pod)
            ? currentPods.filter(p => p !== pod)
            : [...currentPods, pod];
          return { ...group, pods: newPods };
        }
        return group;
      })
    );
  };

  const handleSave = () => {
    updateOAGroups(editingGroups);
    alert('Configuration sauvegardée !');
  };

  const handleReset = () => {
    setEditingGroups(oaGroups);
  };

  const getPodColor = (pod: Pod) => {
    const colors = {
      [Pod.WEA]: 'bg-blue-500',
      [Pod.WECA]: 'bg-green-500',
      [Pod.MENA]: 'bg-yellow-500',
      [Pod.ACE]: 'bg-red-500',
      [Pod.MS]: 'bg-purple-500',
      [Pod.B2B]: 'bg-pink-500',
    };
    return colors[pod] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuration</h1>
          <p className="text-slate-400 mt-1">
            Configurez les groupes OA et leur attribution des pods
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Vue d'ensemble des pods */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Pods Disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {allPods.map(pod => (
            <div key={pod} className="text-center">
              <div className={`w-16 h-16 ${getPodColor(pod)} rounded-lg flex items-center justify-center text-white font-semibold text-sm mx-auto mb-2`}>
                {pod}
              </div>
              <p className="text-sm text-slate-300">{pod}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration des groupes OA */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Attribution des Groupes OA</h2>
        
        {editingGroups.map(group => (
          <div key={group.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                <p className="text-sm text-slate-400">
                  {group.pods.length} pod(s) assigné(s)
                </p>
              </div>
              <div className="text-2xl">
                {group.id === 'oa1' ? '🟦' : group.id === 'oa2' ? '🟩' : '🟨'}
              </div>
            </div>

            {/* Grille de sélection des pods */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">
                Sélectionnez les pods pour ce groupe :
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {allPods.map(pod => {
                  const isSelected = group.pods.includes(pod);
                  const isUsedElsewhere = editingGroups
                    .filter(g => g.id !== group.id)
                    .some(g => g.pods.includes(pod));

                  return (
                    <button
                      key={pod}
                      onClick={() => handlePodToggle(group.id, pod)}
                      disabled={!isSelected && isUsedElsewhere}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all text-sm font-medium
                        ${isSelected 
                          ? `${getPodColor(pod)} border-white text-white` 
                          : isUsedElsewhere
                            ? 'bg-slate-700 border-slate-600 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-600'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span>{pod}</span>
                        {isSelected && <span className="text-xs">✓</span>}
                        {isUsedElsewhere && !isSelected && (
                          <span className="text-xs">Utilisé</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aperçu des pods sélectionnés */}
            {group.pods.length > 0 && (
              <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                <p className="text-xs font-medium text-slate-300 mb-2">Pods assignés :</p>
                <div className="flex flex-wrap gap-2">
                  {group.pods.map(pod => (
                    <span 
                      key={pod}
                      className={`px-2 py-1 ${getPodColor(pod)} text-white rounded text-xs font-medium`}
                    >
                      {pod}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Résumé de la configuration */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Résumé de la Configuration</h3>
        
        <div className="space-y-3">
          {editingGroups.map(group => (
            <div key={group.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {group.id === 'oa1' ? '🟦' : group.id === 'oa2' ? '🟩' : '🟨'}
                </span>
                <span className="font-medium text-white">{group.name}</span>
              </div>
              <div className="flex space-x-2">
                {group.pods.map(pod => (
                  <span 
                    key={pod}
                    className={`px-2 py-1 ${getPodColor(pod)} text-white rounded text-xs font-medium`}
                  >
                    {pod}
                  </span>
                ))}
                {group.pods.length === 0 && (
                  <span className="px-2 py-1 bg-red-600 text-white rounded text-xs">
                    Aucun pod assigné
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Validation */}
        <div className="mt-4 p-3 rounded-lg bg-blue-950 border border-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-0.5">ℹ️</span>
            <div className="text-sm">
              <p className="text-blue-300 font-medium">Règles de validation :</p>
              <ul className="mt-1 space-y-1 text-blue-200">
                <li>• Chaque pod ne peut être assigné qu'à un seul groupe</li>
                <li>• Chaque groupe OA doit avoir au moins un pod assigné</li>
                <li>• La configuration par défaut respecte l'organisation actuelle</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}