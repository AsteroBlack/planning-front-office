# Planning Front Office

Application web pour la génération automatique des plannings d'équipes front office.

## Fonctionnalités

✅ **Gestion des employés** : Ajouter/supprimer des employés, gérer les congés et disponibilités  
✅ **Configuration des groupes OA** : Assigner les pods aux différents groupes OA  
✅ **Génération automatique** : Création intelligente du planning mensuel  
✅ **Visualisation** : Grille de planning style Excel avec couleurs par employé  
✅ **Export Excel** : Export du planning au format .xlsx  
✅ **Interface responsive** : Design moderne et sombre  

## Technologies

- **Next.js 16** (React)
- **TypeScript** pour la type safety
- **Zustand** pour la gestion d'état
- **CSS personnalisé** (style Tailwind)
- **xlsx** (SheetJS) pour l'export Excel

## Installation

```bash
cd planning-app
npm install
```

## Développement

```bash
npm run dev
# Ouvre http://localhost:3000
```

## Production

```bash
npm run build
npm start
```

## Utilisation

1. **Employés** (`/employees`) : Gérez votre équipe et leurs disponibilités
2. **Configuration** (`/settings`) : Configurez l'attribution des pods aux groupes OA
3. **Génération** (`/generate`) : Créez un planning mensuel automatiquement
4. **Dashboard** (`/`) : Visualisez et exportez le planning généré

## Règles de Planning

- **Semaine** : 9 postes (3 OA principaux, 3 OA secondaires, 3 Desk)
- **Weekend** : 4 postes (1 OA global, 3 Desk)
- **OA Principaux** : Travaillent Lun-Ven, OFF le weekend
- **Repos après nuit** : 2 jours obligatoires après un shift de nuit
- **Équilibrage** : 4-5 shifts maximum par employé et par semaine

## Configuration par Défaut

**Employés** : RODRIC, MARIAM, MICHELLE, FREDERIC, AYMARD, BOSSOU, ASSALE, HILLI, EMMANUEL, CHRISTOPHER

**Groupes OA** :
- OA1 : WECA + WEA
- OA2 : MS  
- OA3 : B2B + MENA + ACE

## Structure du Code

```
app/
├── lib/
│   ├── types.ts          # Types TypeScript
│   ├── scheduler.ts      # Moteur de planification
│   ├── store.ts          # Store Zustand
│   └── excel-export.ts   # Export Excel
├── components/
│   ├── Navigation.tsx    # Menu latéral
│   └── PlanningGrid.tsx  # Grille de planning
├── employees/            # Page gestion employés
├── settings/             # Page configuration
├── generate/             # Page génération
└── page.tsx              # Dashboard
```

## Export Excel

L'export génère un fichier `.xlsx` avec :
- Grille des affectations par jour/créneau
- Couleurs par employé
- Format compatible avec les outils existants

---

**Star Platinum Planning v1.0** - Système de planification automatique 🟣