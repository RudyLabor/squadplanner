import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

// types.ts exports
import { d } from '../icons/types'

// navigation.tsx exports
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight,
  ChevronDown, ChevronLeft, ChevronRight,
  Compass, CornerUpRight, ExternalLink, Forward, Home,
  LayoutGrid, LogIn, LogOut, Menu, Reply,
  Search, SearchX, ZoomIn, ZoomOut,
} from '../icons/navigation'

// status.tsx exports
import {
  AlertCircle, AlertTriangle, Bell, BellOff,
  Check, CheckCheck, CheckCircle, CheckCircle2, Circle,
  HelpCircle, Info, Loader2, Lock, Shield, ShieldAlert, ShieldCheck,
  Eye, EyeOff, XCircle, Activity, Wifi, WifiOff,
} from '../icons/status'

// media.tsx exports
import {
  Camera, Download, Headphones, Mail, MessageCircle, MessageSquare,
  Mic, Mic2, MicOff, Monitor, Pause, Phone, PhoneIncoming,
  PhoneMissed, PhoneOff, Play, Radio, Send, Speaker, Tv,
  Vibrate, Volume, Volume1, Volume2, VolumeX,
} from '../icons/media'

// actions.tsx exports
import {
  Copy, Edit2, Link, Minus, Pencil, Pin, PinOff,
  Plug, Plus, RefreshCw, RotateCw, Settings, Share2,
  Trash2, Wrench, X, MousePointerClick,
} from '../icons/actions'

// misc.tsx exports
import {
  Award, BarChart3, Calendar, CalendarCheck, CalendarPlus,
  Clock, Cookie, Crown, Database, FileText, Flame,
  FolderOpen, Gamepad2, Gift, Globe, Hash, Inbox,
  Infinity, Languages, MapPin, Megaphone, Moon,
  MoreHorizontal, Palette, PartyPopper, Rocket,
} from '../icons/misc'

// social.tsx exports
import {
  Smile, Sparkles, Square, Star, Sun, Target,
  TrendingUp, Trophy, User, UserPlus, Users, Zap,
} from '../icons/social'

describe('Icon Components', () => {
  describe('types.ts runtime exports', () => {
    it('exports default SVG props (d)', () => {
      expect(d).toBeDefined()
      expect(d.xmlns).toBe('http://www.w3.org/2000/svg')
      expect(d.width).toBe(24)
      expect(d.height).toBe(24)
      expect(d.fill).toBe('none')
      expect(d.stroke).toBe('currentColor')
      expect(d.strokeWidth).toBe(2)
    })
  })

  describe('navigation icons', () => {
    const icons = {
      ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight,
      ChevronDown, ChevronLeft, ChevronRight,
      Compass, CornerUpRight, ExternalLink, Forward, Home,
      LayoutGrid, LogIn, LogOut, Menu, Reply,
      Search, SearchX, ZoomIn, ZoomOut,
    }

    for (const [name, Icon] of Object.entries(icons)) {
      it(`${name} renders as SVG`, () => {
        const { container } = render(createElement(Icon, {}))
        const svg = container.querySelector('svg')
        expect(svg, `${name} should render an SVG element`).toBeTruthy()
      })
    }
  })

  describe('status icons', () => {
    const icons = {
      AlertCircle, AlertTriangle, Bell, BellOff,
      Check, CheckCheck, CheckCircle, CheckCircle2, Circle,
      HelpCircle, Info, Loader2, Lock, Shield, ShieldAlert, ShieldCheck,
      Eye, EyeOff, XCircle, Activity, Wifi, WifiOff,
    }

    for (const [name, Icon] of Object.entries(icons)) {
      it(`${name} renders as SVG`, () => {
        const { container } = render(createElement(Icon, {}))
        const svg = container.querySelector('svg')
        expect(svg, `${name} should render an SVG element`).toBeTruthy()
      })
    }
  })

  describe('media icons', () => {
    const icons = {
      Camera, Download, Headphones, Mail, MessageCircle, MessageSquare,
      Mic, Mic2, MicOff, Monitor, Pause, Phone, PhoneIncoming,
      PhoneMissed, PhoneOff, Play, Radio, Send, Speaker, Tv,
      Vibrate, Volume, Volume1, Volume2, VolumeX,
    }

    for (const [name, Icon] of Object.entries(icons)) {
      it(`${name} renders as SVG`, () => {
        const { container } = render(createElement(Icon, {}))
        const svg = container.querySelector('svg')
        expect(svg, `${name} should render an SVG element`).toBeTruthy()
      })
    }
  })

  describe('actions icons', () => {
    const icons = {
      Copy, Edit2, Link, Minus, Pencil, Pin, PinOff,
      Plug, Plus, RefreshCw, RotateCw, Settings, Share2,
      Trash2, Wrench, X, MousePointerClick,
    }

    for (const [name, Icon] of Object.entries(icons)) {
      it(`${name} renders as SVG`, () => {
        const { container } = render(createElement(Icon, {}))
        const svg = container.querySelector('svg')
        expect(svg, `${name} should render an SVG element`).toBeTruthy()
      })
    }
  })

  describe('misc icons', () => {
    const icons = {
      Award, BarChart3, Calendar, CalendarCheck, CalendarPlus,
      Clock, Cookie, Crown, Database, FileText, Flame,
      FolderOpen, Gamepad2, Gift, Globe, Hash, Inbox,
      Infinity, Languages, MapPin, Megaphone, Moon,
      MoreHorizontal, Palette, PartyPopper, Rocket,
    }

    for (const [name, Icon] of Object.entries(icons)) {
      it(`${name} renders as SVG`, () => {
        const { container } = render(createElement(Icon, {}))
        const svg = container.querySelector('svg')
        expect(svg, `${name} should render an SVG element`).toBeTruthy()
      })
    }
  })

  describe('social icons', () => {
    const icons = {
      Smile, Sparkles, Square, Star, Sun, Target,
      TrendingUp, Trophy, User, UserPlus, Users, Zap,
    }

    for (const [name, Icon] of Object.entries(icons)) {
      it(`${name} renders as SVG`, () => {
        const { container } = render(createElement(Icon, {}))
        const svg = container.querySelector('svg')
        expect(svg, `${name} should render an SVG element`).toBeTruthy()
      })
    }
  })

  describe('icons.tsx re-export barrel', () => {
    it('re-exports from icons/index', async () => {
      const barrel = await import('../icons')
      expect(barrel.ArrowLeft).toBeDefined()
      expect(barrel.Check).toBeDefined()
      expect(barrel.Mic).toBeDefined()
      expect(barrel.Copy).toBeDefined()
      expect(barrel.Award).toBeDefined()
      expect(barrel.Star).toBeDefined()
    })
  })

  describe('icon props passthrough', () => {
    it('passes className to SVG element', () => {
      const { container } = render(createElement(Star, { className: 'custom-class' }))
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('class')).toBe('custom-class')
    })

    it('passes data attributes', () => {
      const { container } = render(createElement(Home, { 'data-testid': 'home-icon' } as any))
      const svg = container.querySelector('[data-testid="home-icon"]')
      expect(svg).toBeTruthy()
    })
  })
})
