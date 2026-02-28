import { ArrowLeft, Shield, FileText } from '../components/icons'
import { Link, useSearchParams } from 'react-router'
import { ScrollProgress } from '../components/ui/ScrollProgress'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useStatePersistence } from '../hooks/useStatePersistence'
import { useHashNavigation } from '../hooks/useHashNavigation'
import { CGUContent } from './legal/CGUContent'
import { PrivacyContent } from './legal/PrivacyContent'

type LegalTab = 'cgu' | 'privacy'

export function Legal() {
  const [searchParams] = useSearchParams()
  useHashNavigation()
  const initialTab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'cgu'
  const [activeTab, setActiveTab] = useStatePersistence<LegalTab>('legal_tab', initialTab)

  return (
    <div className="min-h-[100dvh] bg-bg-base mesh-bg">
      <ScrollProgress />
      <header className="sticky top-0 z-10 bg-bg-base/90 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-border-subtle flex items-center justify-center hover:bg-border-hover transition-colors"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-2">
            <SquadPlannerLogo size={24} />
            <span className="text-md font-semibold text-text-primary">Squad Planner</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div
          className="flex gap-2 p-1 rounded-xl bg-surface-card border border-border-default mb-8"
          role="tablist"
          aria-label="Documents légaux"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'cgu'}
            onClick={() => setActiveTab('cgu')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-md font-medium transition-all ${
              activeTab === 'cgu'
                ? 'bg-primary-bg text-white shadow-lg shadow-primary/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-border-subtle'
            }`}
          >
            <FileText className="w-4 h-4" />
            Conditions d'utilisation
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'privacy'}
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-md font-medium transition-all ${
              activeTab === 'privacy'
                ? 'bg-primary-bg text-white shadow-lg shadow-primary/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-border-subtle'
            }`}
          >
            <Shield className="w-4 h-4" />
            Politique de confidentialité
          </button>
        </div>

        {activeTab === 'cgu' && <CGUContent />}
        {activeTab === 'privacy' && <PrivacyContent />}

        <div className="mt-8 text-center">
          <p className="text-sm text-text-tertiary">Squad Planner SAS — France</p>
        </div>
      </main>
    </div>
  )
}

export default Legal
