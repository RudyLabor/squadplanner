<claude-mem-context>

</claude-mem-context>

## Instructions pour tous les agents

- **Toujours répondre en français.** L'utilisateur est francophone. Pas d'anglais dans les réponses conversationnelles.

## Architecture & Contraintes techniques

- **NE PAS utiliser React Server Components (RSC).** Le mode RSC (`unstable_reactRouterRSC` + `@vitejs/plugin-rsc`) est expérimental et **incompatible avec le déploiement Vercel**. Il cause une erreur 500 (`groupRoutesByParentId: Cannot convert undefined or null to object`) car l'adaptateur `@vercel/react-router` ne supporte pas le format RSC. Utiliser uniquement le mode SSR standard avec `reactRouter()` de `@react-router/dev/vite` et le preset `vercelPreset()`.
- **Framework mode :** React Router v7 en mode Framework avec SSR, preset Vercel, et prerendering des pages publiques.