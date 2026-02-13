/**
 * COMPOSANT DE DÉMONSTRATION i18n
 *
 * Ce composant démontre le système d'internationalisation en action.
 * Il peut être importé temporairement dans n'importe quelle page pour tester.
 *
 * Usage:
 * ```tsx
 * import { LanguageDemo } from '../components/LanguageDemo'
 *
 * <LanguageDemo />
 * ```
 */

import { useT, useLocale, useSetLocale } from '../lib/i18n'

export function LanguageDemo() {
  const t = useT()
  const locale = useLocale()
  const setLocale = useSetLocale()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '20px',
        background: 'white',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '300px',
        zIndex: 9999,
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>🌐 i18n Demo</h3>

      {/* Language switcher */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setLocale('fr')}
          style={{
            padding: '8px 16px',
            marginRight: '8px',
            background: locale === 'fr' ? '#3b82f6' : '#e5e7eb',
            color: locale === 'fr' ? 'white' : 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: locale === 'fr' ? 'bold' : 'normal',
          }}
        >
          🇫🇷 FR
        </button>
        <button
          onClick={() => setLocale('en')}
          style={{
            padding: '8px 16px',
            background: locale === 'en' ? '#3b82f6' : '#e5e7eb',
            color: locale === 'en' ? 'white' : 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: locale === 'en' ? 'bold' : 'normal',
          }}
        >
          🇬🇧 EN
        </button>
      </div>

      {/* Demo translations */}
      <div
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '12px',
        }}
      >
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>{t('nav.home')}</strong>
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>{t('nav.sessions')}</strong>
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>{t('nav.squads')}</strong>
        </p>

        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <p style={{ margin: '0 0 8px 0' }}>{t('actions.create')}</p>
        <p style={{ margin: '0 0 8px 0' }}>{t('actions.edit')}</p>
        <p style={{ margin: '0 0 8px 0' }}>{t('actions.delete')}</p>

        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <p style={{ margin: '0 0 8px 0' }}>{t('squads.members', 5)}</p>
        <p style={{ margin: '0 0 8px 0' }}>{t('time.hoursAgo', 3)}</p>

        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
          {t('empty.sessions')}
        </p>
        <p style={{ margin: '0', fontSize: '12px', color: '#10b981' }}>{t('success.saved')}</p>
      </div>

      <div
        style={{
          marginTop: '12px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        Locale: <strong>{locale}</strong>
      </div>
    </div>
  )
}
