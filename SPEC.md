# Planning Front Office — Spécification

## Contexte
Application web pour générer automatiquement l'emploi du temps des équipes front office.
Export en Excel, partage WhatsApp.

## Équipe
- 10 personnes (configurable)
- Liste actuelle : RODRIC, MARIAM, MICHELLE, FREDERIC, AYMARD, BOSSOU, ASSALE, HILLI, EMMANUEL, CHRISTOPHER
  (+ historiques : ANNA-MURIELLE, ABOUBAKR, BERENICE, YASMIN)

## Pods (6)
WEA, WECA, MENA, ACE, MS, B2B

## Groupes OA (configurable)
- OA1 : WECA, WEA
- OA2 : MS
- OA3 : B2B, MENA, ACE

## Créneaux

### Semaine (Lun-Ven) — 9 postes/jour
| Poste | Horaire | Personnes |
|-------|---------|-----------|
| Desk Matin | 8h-14h | 1 |
| OA1 Principal | 8h-17h | 1 (fixe Lun-Ven) |
| OA1 Secondaire | 8h-17h | tourne dans la semaine |
| OA2 Principal | 8h-17h | 1 (fixe Lun-Ven) |
| OA2 Secondaire | 8h-17h | tourne |
| OA3 Principal | 8h-17h | 1 (fixe Lun-Ven) |
| OA3 Secondaire | 8h-17h | tourne |
| Desk Après-midi | 14h-20h | 1 |
| Desk Nuit | 20h-8h | 1 |

### Week-end (Sam-Dim) — 4 postes/jour
| Poste | Horaire | Personnes |
|-------|---------|-----------|
| OA (tous pods) | 8h-17h | 1 |
| Desk Matin | 8h-14h | 1 |
| Desk Après-midi | 14h-20h | 1 |
| Desk Nuit | 20h-8h | 1 |

## Règles

### Repos
- Repos **uniquement** après une nuit
- 2 jours de repos consécutifs après une nuit (les 2 jours suivants)
- Pas de repos sinon

### Shifts/semaine
- Minimum 4 shifts, Maximum 5 shifts par personne
- 30 à 42 heures de travail par semaine

### OA Principal
- Travaille du Lundi au Vendredi (5 shifts)
- **Ne travaille PAS le week-end**
- 3 OA principaux (1 par groupe) sont donc off le week-end
- Rotation : OA principal Groupe A semaine 1 → Groupe B semaine 2 → Groupe C semaine 3 → repos du poste
- Rotation complète de toute l'équipe avant de revenir

### Week-end
- 3 OA principaux sont off → 7 personnes disponibles
- 1 OA couvre tous les pods
- 3 Desks (matin, aprèm, nuit)

### Congés/Indisponibilités
- Réaménagement possible du planning

## Stack technique
- **Next.js** (React)
- **Tailwind CSS** pour le style
- **xlsx** (SheetJS) pour export Excel
- Pas de BDD — stockage local (localStorage ou fichiers JSON)
- PWA possible pour mobile

## Fonctionnalités
1. **Gestion employés** : ajouter/supprimer/mettre en congé
2. **Configuration groupes OA** : modifier pods par groupe
3. **Génération automatique** du planning mensuel
4. **Visualisation** : vue semaine et vue mois
5. **Export Excel** : format similaire au fichier existant
6. **Partage WhatsApp** : lien ou fichier
7. **Édition manuelle** : ajuster le planning généré si besoin
