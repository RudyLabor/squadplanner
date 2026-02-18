import { type RouteConfig, route, index, layout } from '@react-router/dev/routes'

export default [
  // Public pages (pre-rendered at build time)
  index('./routes/_index.tsx'),
  route('auth', './routes/auth.tsx'),
  route('legal', './routes/legal.tsx'),
  route('help', './routes/help.tsx'),
  route('premium', './routes/premium.tsx'),
  route('maintenance', './routes/maintenance.tsx'),
  route('join/:code', './routes/join-squad.tsx'),
  route('s/:id', './routes/session-share.tsx'),

  // Protected pages (wrapped in auth-checking layout)
  layout('./routes/_protected.tsx', [
    route('home', './routes/home.tsx'),
    route('squads', './routes/squads.tsx'),
    route('squad/:id', './routes/squad-detail.tsx'),
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
    route('auth/discord/callback', './routes/discord-callback.tsx'),
  ]),

  // Onboarding (protected but skips onboarding check)
  route('onboarding', './routes/onboarding.tsx'),

  // 404 catch-all
  route('*', './routes/not-found.tsx'),
] satisfies RouteConfig
