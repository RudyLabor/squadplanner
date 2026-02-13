import { Home, Users, Mic, MessageCircle, User } from '../icons'
// ─── MOCK DATA ─────────────────────────────────────────
export const mockMembers = [
  { name: 'Max', initial: 'M', color: 'var(--color-primary)', score: 94 },
  { name: 'Luna', initial: 'L', color: 'var(--color-success)', score: 100 },
  { name: 'Kira', initial: 'K', color: 'var(--color-warning)', score: 87 },
  { name: 'Jay', initial: 'J', color: 'var(--color-purple)', score: 92 },
  { name: 'Zoe', initial: 'Z', color: 'var(--color-error)', score: 78 },
]

// ─── Shared Navbar Component ───
export function MockNavbar({ active }: { active: string }) {
  const items = [
    { icon: Home, label: 'Accueil', id: 'home' },
    { icon: Users, label: 'Squads', id: 'squads' },
    { icon: Mic, label: 'Party', id: 'party' },
    { icon: MessageCircle, label: 'Messages', id: 'messages' },
    { icon: User, label: 'Profil', id: 'profile' },
  ]
  return (
    <div className="mt-auto px-3 py-2.5 flex items-center justify-around border-t border-border-subtle">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.id === active
        return (
          <div key={item.id} className="flex flex-col items-center gap-0.5">
            <Icon
              className="w-4 h-4"
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
            />
            <span
              className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-text-tertiary'}`}
            >
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
