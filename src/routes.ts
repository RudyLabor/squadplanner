import { type RouteConfig, route, index, layout } from '@react-router/dev/routes'

export default [
  // Public pages (pre-rendered at build time)
  index('./routes/_index.tsx'),
  route('auth', './routes/auth.tsx'),
  route('login', './routes/login.tsx'), // BUG FIX #3: Redirect /login to /auth
  route('legal', './routes/legal.tsx'),
  route('help', './routes/help.tsx'),
  route('premium', './routes/premium.tsx'),
  route('maintenance', './routes/maintenance.tsx'),
  route('join/:code', './routes/join-squad.tsx'),
  route('s/:id', './routes/session-share.tsx'),

  // SEO: Game pages (pre-rendered)
  route('games/:game', './routes/games.$game.tsx'),
  route('lfg/:game', './routes/lfg.$game.tsx'),

  // SEO: Alternative / comparison pages (pre-rendered)
  route('alternative/guilded', './routes/alternative.guilded.tsx'),
  route('alternative/gamerlink', './routes/alternative.gamerlink.tsx'),
  route('alternative/discord-events', './routes/alternative.discord-events.tsx'),
  route('vs/guilded-vs-squad-planner', './routes/vs.guilded-vs-squad-planner.tsx'),
  route('vs/discord-vs-squad-planner', './routes/vs.discord-vs-squad-planner.tsx'),
  route('vs/google-calendar-vs-squad-planner', './routes/vs.google-calendar-vs-squad-planner.tsx'),

  // SEO: Feature pages (pre-rendered)
  route('features/score-fiabilite', './routes/features.score-fiabilite.tsx'),
  route('features/gamification', './routes/features.gamification.tsx'),
  route('features/coach-ia', './routes/features.coach-ia.tsx'),
  route('features/analytics', './routes/features.analytics.tsx'),
  route('how-it-works', './routes/how-it-works.tsx'),

  // SEO: Solutions, glossaire, avis (pre-rendered)
  route('glossaire', './routes/glossaire.tsx'),
  route('solutions/clubs-esport', './routes/solutions.clubs-esport.tsx'),
  route('solutions/streamers', './routes/solutions.streamers.tsx'),
  route('avis', './routes/avis.tsx'),

  // Blog pages (pre-rendered)
  route('blog', './routes/blog._index.tsx'),
  route('blog/:slug', './routes/blog.$slug.tsx'),

  // sitemap.xml is generated as a static file by scripts/generate-sitemap.mjs
  // and served directly from public/ by Vercel (no React Router route needed)

  // Embeddable widget (public, iframe-friendly)
  route('widget/:squadId', './routes/widget.$squadId.tsx'),

  // Ambassador program (public, pre-rendered)
  route('ambassador', './routes/ambassador.tsx'),

  // Contact page for Club tier (public, pre-rendered)
  route('contact', './routes/contact.tsx'),

  // Protected pages (wrapped in auth-checking layout)
  layout('./routes/_protected.tsx', [
    route('home', './routes/home.tsx'),
    route('squads', './routes/squads.tsx'),
    route('squad/:id', './routes/squad-detail.tsx'),
    route('squad/:id/analytics', './routes/squad.$id.analytics.tsx'),
    route('sessions', './routes/sessions.tsx'),
    route('session/:id', './routes/session-detail.tsx'),
    route('messages', './routes/messages.tsx'),
    route('party', './routes/party.tsx'),
    route('discover', './routes/discover.tsx'),
    route('profile', './routes/profile.tsx'),
    route('u/:username', './routes/public-profile.tsx'),
    route('settings', './routes/settings.tsx'),
    route('call-history', './routes/call-history.tsx'),
    route('referrals', './routes/referrals.tsx'),
    route('club', './routes/club-dashboard.tsx'),
    route('wrapped', './routes/wrapped.tsx'),
    route('auth/discord/callback', './routes/discord-callback.tsx'),
  ]),

  // Onboarding (protected but skips onboarding check)
  route('onboarding', './routes/onboarding.tsx'),

  // 404 catch-all
  route('*', './routes/not-found.tsx'),
] satisfies RouteConfig
