# CLAUDE.md - Instructions pour l'Agent OpenClaw

## 🖥️ ENVIRONNEMENT : Windows PowerShell
**JAMAIS de commandes Unix !**

## ✅ COMMANDES AUTORISÉES
```powershell
# Lister
dir
Get-ChildItem

# Lire (TOUJOURS vérifier avant)
Test-Path "chemin/fichier"
Get-Content "chemin/fichier" -Encoding UTF8

# Navigation
cd, Set-Location
```

## ❌ COMMANDES INTERDITES
```bash
ls -la    # ❌ Unix
cat       # ❌ Unix  
grep      # ❌ Unix
find      # ❌ Unix
```

## 📂 STRUCTURE RÉELLE DU PROJET
- **Racine :** `src/root.tsx` (PAS App.tsx)
- **Composants :** `src/components/` (à plat, pas de sous-dossiers /chat/)
- **MessageActions :** `src/components/MessageActions.tsx`

## 🛠️ WORKFLOW OBLIGATOIRE
1. **TOUJOURS** vérifier l'existence avec `dir` avant de lire
2. **JAMAIS** supposer l'existence d'un fichier
3. **TOUJOURS** utiliser les outils OpenClaw natifs (Read/Write/Edit)

## 🚨 ERREURS À ÉVITER
- Ne PAS chercher `src\components\chat\MessageActions.tsx`
- Ne PAS utiliser `ls -la`
- Ne PAS lire sans vérifier l'existence

## 📋 CHECKLIST AVANT CHAQUE ACTION
- [ ] J'utilise `dir` au lieu de `ls -la`
- [ ] Je vérifie que le fichier existe 
- [ ] J'utilise le bon chemin (src/components/ à plat)
- [ ] J'utilise Read/Write/Edit (les outils natifs fonctionnent)

---
**Dernière mise à jour :** 22 février 2026
**But :** Arrêter de répéter les mêmes erreurs basiques.