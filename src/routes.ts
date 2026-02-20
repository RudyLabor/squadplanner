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

  // Blog pages (pre-rendered)
  route('blog', './routes/blog._index.tsx'),
  route('blog/:slug', './routes/blog.$slug.tsx'),

  // Dynamic sitemap
  route('sitemap.xml', './routes/sitemap[.]xml.tsx'),

  // Embeddable widget (public, iframe-friendly)
  route('widget/:squadId', './routes/widget.$squadId.tsx'),

  // Ambassador program (public, pre-rendered)
  route('ambassador', './routes/ambassador.tsx'),

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
