import React from 'react';
import { tokens } from '../tokens';

// SVG icon paths (replaces lucide-react to avoid dependency)
const icons: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  squads: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  party: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
  messages: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
};

const navItems = [
  { icon: 'home', label: 'Accueil', id: 'home' },
  { icon: 'squads', label: 'Squads', id: 'squads' },
  { icon: 'party', label: 'Party', id: 'party' },
  { icon: 'messages', label: 'Messages', id: 'messages' },
  { icon: 'profile', label: 'Profil', id: 'profile' },
];

interface MockNavbarProps {
  active: string;
}

export const MockNavbar: React.FC<MockNavbarProps> = ({ active }) => {
  return (
    <div
      style={{
        marginTop: 'auto',
        padding: '8px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTop: `1px solid rgba(255,255,255,0.04)`,
      }}
    >
      {navItems.map((item) => {
        const isActive = item.id === active;
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke={isActive ? tokens.indigo : tokens.textMuted}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icons[item.icon]} />
            </svg>
            <span
              style={{
                fontSize: 7,
                color: isActive ? tokens.indigo : tokens.textMuted,
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
