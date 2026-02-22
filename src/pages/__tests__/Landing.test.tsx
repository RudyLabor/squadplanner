import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue({ get: () => 0 }),
  useMotionValue: vi.fn().mockReturnValue({ set: vi.fn(), get: () => 0 }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0 }),
  useInView: vi.fn().mockReturnValue(true),
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy(
    {},
    {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }
  ),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: null, profile: null, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: null, profile: null }) }
  ),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  ArrowRight: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock all landing sub-components
vi.mock('../../components/landing/CustomCursor', () => ({
  CustomCursor: () => null,
}))

vi.mock('../../components/landing/LandingNavbar', () => ({
  LandingNavbar: ({ isLoggedIn }: any) =>
    createElement('nav', { 'data-testid': 'landing-navbar' }, 'Navbar'),
}))

vi.mock('../../components/landing/LandingHero', () => ({
  LandingHero: () => createElement('div', { 'data-testid': 'landing-hero' }, 'Hero'),
}))

vi.mock('../../components/landing/SocialProofSection', () => ({
  SocialProofSection: () => createElement('div', { 'data-testid': 'social-proof' }, 'Social Proof'),
}))

vi.mock('../../components/landing/ProblemSection', () => ({
  ProblemSection: () => createElement('div', null, 'Problem Section'),
}))

vi.mock('../../components/landing/HowItWorksSection', () => ({
  HowItWorksSection: () => createElement('div', null, 'How It Works'),
}))

vi.mock('../../components/landing/FeaturesSection', () => ({
  FeaturesSection: () => createElement('div', null, 'Features'),
}))

vi.mock('../../components/landing/ReliabilitySection', () => ({
  ReliabilitySection: () => createElement('div', null, 'Reliability'),
}))

vi.mock('../../components/landing/ComparisonSection', () => ({
  ComparisonSection: () => createElement('div', null, 'Comparison'),
}))

vi.mock('../../components/landing/TestimonialCarousel', () => ({
  TestimonialCarousel: () => createElement('div', null, 'Testimonials'),
}))

vi.mock('../../components/landing/PricingSection', () => ({
  PricingSection: () => createElement('div', null, 'Pricing'),
}))

vi.mock('../../components/landing/FaqSection', () => ({
  FaqSection: () => createElement('div', null, 'FAQ'),
}))

vi.mock('../../components/landing/CtaSection', () => ({
  CtaSection: () => createElement('div', null, 'CTA'),
}))

vi.mock('../../components/landing/LandingFooter', () => ({
  LandingFooter: () => createElement('footer', { 'data-testid': 'landing-footer' }, 'Footer'),
}))

vi.mock('../../components/landing/MobileStickyCTA', () => ({
  MobileStickyCTA: () => null,
}))

import Landing from '../Landing'

describe('Landing', () => {
  it('renders without crashing', () => {
    render(createElement(Landing))
    expect(screen.getByTestId('landing-navbar')).toBeTruthy()
  })

  it('renders hero section', () => {
    render(createElement(Landing))
    expect(screen.getByTestId('landing-hero')).toBeTruthy()
  })

  it('renders social proof section', () => {
    render(createElement(Landing))
    expect(screen.getByTestId('social-proof')).toBeTruthy()
  })

  it('renders footer', () => {
    render(createElement(Landing))
    expect(screen.getByTestId('landing-footer')).toBeTruthy()
  })

  it('renders skip-to-content link for accessibility', () => {
    render(createElement(Landing))
    expect(screen.getByText('Aller au contenu principal')).toBeTruthy()
  })
})
