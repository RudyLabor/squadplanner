import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

// actions.tsx exports
import {
  Copy,
  Edit2,
  Link,
  Minus,
  Pencil,
  Pin,
  PinOff,
  Plug,
  Plus,
  RefreshCw,
  RotateCw,
  Settings,
  Share2,
  Trash2,
  Wrench,
  X,
  MousePointerClick,
} from '../actions'

// media.tsx exports
import {
  Camera,
  Download,
  Headphones,
  Mail,
  MessageCircle,
  MessageSquare,
  Mic,
  Mic2,
  MicOff,
  Monitor,
  Pause,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Play,
  Radio,
  Send,
  Speaker,
  Tv,
  Vibrate,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from '../media'

// misc.tsx exports
import {
  Award,
  BarChart3,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Cookie,
  Crown,
  Database,
  FileText,
  Flame,
  FolderOpen,
  Gamepad2,
  Gift,
  Globe,
  Hash,
  Inbox,
  Infinity,
  Languages,
  MapPin,
  Megaphone,
  Moon,
  MoreHorizontal,
  Palette,
  PartyPopper,
  Rocket,
} from '../misc'

// navigation.tsx exports
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  CornerUpRight,
  ExternalLink,
  Forward,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Reply,
  Search,
  SearchX,
  ZoomIn,
  ZoomOut,
} from '../navigation'

// social.tsx exports
import {
  Smile,
  Sparkles,
  Square,
  Star,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  User,
  UserPlus,
  Users,
  Zap,
} from '../social'

// status.tsx exports
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckCircle,
  CheckCircle2,
  Circle,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  XCircle,
  Activity,
  Wifi,
  WifiOff,
} from '../status'

// index.ts barrel exports
import { d } from '../index'
import type { IconProps } from '../index'

// icons.tsx re-export
import * as IconsBarrel from '../../icons'

describe('icons', () => {
  describe('types and defaults', () => {
    it('exports default SVG attributes (d)', () => {
      expect(d).toBeDefined()
      expect(d.xmlns).toBe('http://www.w3.org/2000/svg')
      expect(d.width).toBe(24)
      expect(d.height).toBe(24)
      expect(d.viewBox).toBe('0 0 24 24')
      expect(d.fill).toBe('none')
      expect(d.stroke).toBe('currentColor')
      expect(d.strokeWidth).toBe(2)
      expect(d.strokeLinecap).toBe('round')
      expect(d.strokeLinejoin).toBe('round')
    })

    it('IconProps type can be used', () => {
      const props: IconProps = { className: 'test' }
      expect(props.className).toBe('test')
    })
  })

  describe('actions icons render without crash', () => {
    const actionIcons = {
      Copy,
      Edit2,
      Link,
      Minus,
      Pencil,
      Pin,
      PinOff,
      Plug,
      Plus,
      RefreshCw,
      RotateCw,
      Settings,
      Share2,
      Trash2,
      Wrench,
      X,
      MousePointerClick,
    }

    it.each(Object.entries(actionIcons))('%s renders without crash', (_name, Icon) => {
      const { container } = render(<Icon />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('media icons render without crash', () => {
    const mediaIcons = {
      Camera,
      Download,
      Headphones,
      Mail,
      MessageCircle,
      MessageSquare,
      Mic,
      Mic2,
      MicOff,
      Monitor,
      Pause,
      Phone,
      PhoneIncoming,
      PhoneMissed,
      PhoneOff,
      Play,
      Radio,
      Send,
      Speaker,
      Tv,
      Vibrate,
      Volume,
      Volume1,
      Volume2,
      VolumeX,
    }

    it.each(Object.entries(mediaIcons))('%s renders without crash', (_name, Icon) => {
      const { container } = render(<Icon />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('misc icons render without crash', () => {
    const miscIcons = {
      Award,
      BarChart3,
      Calendar,
      CalendarCheck,
      CalendarPlus,
      Clock,
      Cookie,
      Crown,
      Database,
      FileText,
      Flame,
      FolderOpen,
      Gamepad2,
      Gift,
      Globe,
      Hash,
      Inbox,
      Infinity,
      Languages,
      MapPin,
      Megaphone,
      Moon,
      MoreHorizontal,
      Palette,
      PartyPopper,
      Rocket,
    }

    it.each(Object.entries(miscIcons))('%s renders without crash', (_name, Icon) => {
      const { container } = render(<Icon />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('navigation icons render without crash', () => {
    const navIcons = {
      ArrowLeft,
      ArrowRight,
      ArrowUp,
      ArrowDown,
      ArrowUpRight,
      ChevronDown,
      ChevronLeft,
      ChevronRight,
      Compass,
      CornerUpRight,
      ExternalLink,
      Forward,
      Home,
      LayoutGrid,
      LogIn,
      LogOut,
      Menu,
      Reply,
      Search,
      SearchX,
      ZoomIn,
      ZoomOut,
    }

    it.each(Object.entries(navIcons))('%s renders without crash', (_name, Icon) => {
      const { container } = render(<Icon />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('social icons render without crash', () => {
    const socialIcons = {
      Smile,
      Sparkles,
      Square,
      Star,
      Sun,
      Target,
      TrendingUp,
      Trophy,
      User,
      UserPlus,
      Users,
      Zap,
    }

    it.each(Object.entries(socialIcons))('%s renders without crash', (_name, Icon) => {
      const { container } = render(<Icon />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('status icons render without crash', () => {
    const statusIcons = {
      AlertCircle,
      AlertTriangle,
      Bell,
      BellOff,
      Check,
      CheckCheck,
      CheckCircle,
      CheckCircle2,
      Circle,
      HelpCircle,
      Info,
      Loader2,
      Lock,
      Shield,
      ShieldAlert,
      ShieldCheck,
      Eye,
      EyeOff,
      XCircle,
      Activity,
      Wifi,
      WifiOff,
    }

    it.each(Object.entries(statusIcons))('%s renders without crash', (_name, Icon) => {
      const { container } = render(<Icon />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('icons accept custom props', () => {
    it('passes className to SVG', () => {
      const { container } = render(<Plus className="custom-class" />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('class')).toBe('custom-class')
    })

    it('passes data-testid to SVG', () => {
      const { container } = render(<Check data-testid="check-icon" />)
      const svg = container.querySelector('[data-testid="check-icon"]')
      expect(svg).toBeTruthy()
    })
  })

  describe('index barrel exports', () => {
    it('re-exports all icon modules from index.ts', () => {
      // Spot check a few from each module
      expect(IconsBarrel.Copy).toBeDefined()
      expect(IconsBarrel.Camera).toBeDefined()
      expect(IconsBarrel.Award).toBeDefined()
      expect(IconsBarrel.ArrowLeft).toBeDefined()
      expect(IconsBarrel.Smile).toBeDefined()
      expect(IconsBarrel.AlertCircle).toBeDefined()
      expect(IconsBarrel.d).toBeDefined()
    })
  })
})
