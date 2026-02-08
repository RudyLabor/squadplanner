import { useState } from 'react'
import { ArrowLeft, Shield, FileText, ChevronDown } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'

type LegalTab = 'cgu' | 'privacy'

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[rgba(255,255,255,0.05)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <h3 className="text-[15px] font-semibold text-[#f7f8f8] group-hover:text-[#a78bfa] transition-colors">{title}</h3>
        <ChevronDown className={`w-4 h-4 text-[#5e6063] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-[14px] text-[#8b8d90] leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export function Legal() {
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'cgu'
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab)

  return (
    <div className="min-h-[100dvh] bg-[#050506]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#050506]/90 backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#8b8d90]" />
          </Link>
          <div className="flex items-center gap-2">
            <SquadPlannerLogo size={24} />
            <span className="text-[15px] font-semibold text-[#f7f8f8]">Squad Planner</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Tab Selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] mb-8">
          <button
            onClick={() => setActiveTab('cgu')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-medium transition-all ${
              activeTab === 'cgu'
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20'
                : 'text-[#8b8d90] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Conditions d'utilisation
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-medium transition-all ${
              activeTab === 'privacy'
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20'
                : 'text-[#8b8d90] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            <Shield className="w-4 h-4" />
            Politique de confidentialité
          </button>
        </div>

        {/* CGU Content */}
        {activeTab === 'cgu' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Conditions Générales d'Utilisation</h1>
              <p className="text-[14px] text-[#5e6063]">Dernière mise à jour : 8 février 2026</p>
            </div>

            <Card className="p-6 bg-[#101012]">
              <Section title="1. Objet" defaultOpen>
                <p>
                  Les présentes Conditions Générales d'Utilisation (CGU) définissent les règles d'utilisation
                  de l'application Squad Planner, éditée par Squad Planner SAS.
                </p>
                <p>
                  Squad Planner est une application de coordination gaming permettant aux joueurs
                  d'organiser des sessions de jeu, de communiquer via chat et appels vocaux,
                  et de suivre la fiabilité de leur squad.
                </p>
              </Section>

              <Section title="2. Acceptation des conditions">
                <p>
                  En créant un compte sur Squad Planner, vous acceptez sans réserve les présentes CGU.
                  Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'application.
                </p>
              </Section>

              <Section title="3. Inscription et compte">
                <p>
                  L'inscription est gratuite et ouverte à toute personne physique âgée de 13 ans minimum.
                  Les mineurs de moins de 16 ans doivent obtenir le consentement de leur représentant légal.
                </p>
                <p>
                  Vous êtes responsable de la confidentialité de vos identifiants de connexion
                  et de toutes les activités réalisées depuis votre compte.
                </p>
                <p>
                  Vous vous engagez à fournir des informations exactes et à ne pas usurper l'identité d'un tiers.
                </p>
              </Section>

              <Section title="4. Services proposés">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Création et gestion de squads (groupes de joueurs)</li>
                  <li>Planification de sessions de jeu avec système RSVP</li>
                  <li>Chat en temps réel (squad et messages directs)</li>
                  <li>Appels vocaux (party vocale et appels 1-to-1)</li>
                  <li>Système de fiabilité et gamification</li>
                  <li>Coach IA pour optimiser l'organisation</li>
                  <li>Notifications push et rappels automatiques</li>
                </ul>
              </Section>

              <Section title="5. Abonnement Premium">
                <p>
                  Certaines fonctionnalités avancées sont réservées aux abonnés Premium.
                  L'abonnement est proposé en formule mensuelle ou annuelle, avec facturation récurrente via Stripe.
                </p>
                <p>
                  Vous pouvez annuler votre abonnement à tout moment depuis les paramètres de l'application.
                  L'annulation prend effet à la fin de la période en cours, sans remboursement prorata.
                </p>
                <p>
                  Un droit de rétractation de 30 jours est accordé après la première souscription.
                </p>
              </Section>

              <Section title="6. Comportement de l'utilisateur">
                <p>Vous vous engagez à ne pas :</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Publier du contenu illicite, diffamatoire, haineux ou discriminatoire</li>
                  <li>Harceler d'autres utilisateurs</li>
                  <li>Tenter de compromettre la sécurité de l'application</li>
                  <li>Utiliser des bots ou scripts automatisés</li>
                  <li>Contourner les mécanismes de limitation ou de gating</li>
                </ul>
                <p>
                  Tout manquement pourra entraîner la suspension ou la suppression de votre compte.
                </p>
              </Section>

              <Section title="7. Propriété intellectuelle">
                <p>
                  L'application Squad Planner, son design, son code source et ses contenus sont protégés
                  par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
                </p>
                <p>
                  Les contenus que vous publiez (messages, avatar) restent votre propriété.
                  Vous accordez à Squad Planner une licence d'utilisation limitée pour le fonctionnement du service.
                </p>
              </Section>

              <Section title="8. Limitation de responsabilité">
                <p>
                  Squad Planner est fourni « en l'état ». Nous faisons nos meilleurs efforts pour assurer
                  la disponibilité et la sécurité du service, mais ne pouvons garantir une disponibilité à 100%.
                </p>
                <p>
                  Squad Planner ne saurait être tenu responsable des contenus publiés par les utilisateurs
                  ni des dommages indirects liés à l'utilisation du service.
                </p>
              </Section>

              <Section title="9. Résiliation">
                <p>
                  Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application.
                  La suppression entraîne l'effacement définitif de toutes vos données personnelles
                  conformément au RGPD.
                </p>
                <p>
                  Squad Planner se réserve le droit de suspendre ou supprimer un compte
                  en cas de violation des présentes CGU.
                </p>
              </Section>

              <Section title="10. Droit applicable">
                <p>
                  Les présentes CGU sont régies par le droit français.
                  En cas de litige, les tribunaux compétents seront ceux de Paris.
                </p>
              </Section>
            </Card>
          </div>
        )}

        {/* Privacy Policy Content */}
        {activeTab === 'privacy' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Politique de Confidentialité</h1>
              <p className="text-[14px] text-[#5e6063]">Dernière mise à jour : 8 février 2026</p>
            </div>

            <Card className="p-6 bg-[#101012]">
              <Section title="1. Responsable du traitement" defaultOpen>
                <p>
                  Le responsable du traitement des données personnelles est Squad Planner SAS,
                  dont le siège social est situé en France.
                </p>
                <p>
                  Contact : privacy@squadplanner.fr
                </p>
              </Section>

              <Section title="2. Données collectées">
                <p>Nous collectons les données suivantes :</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-[#f7f8f8]">Données d'inscription :</strong> email, pseudo, mot de passe (hashé), avatar</li>
                  <li><strong className="text-[#f7f8f8]">Données de profil :</strong> fuseau horaire, préférences de langue</li>
                  <li><strong className="text-[#f7f8f8]">Données d'utilisation :</strong> sessions planifiées, RSVP, check-ins, score de fiabilité</li>
                  <li><strong className="text-[#f7f8f8]">Messages :</strong> contenus des messages squad et DM (chiffrés en transit)</li>
                  <li><strong className="text-[#f7f8f8]">Données techniques :</strong> logs de connexion, type de navigateur, adresse IP (anonymisée)</li>
                  <li><strong className="text-[#f7f8f8]">Appels vocaux :</strong> métadonnées (durée, participants), pas d'enregistrement audio</li>
                </ul>
              </Section>

              <Section title="3. Finalités du traitement">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Fournir et améliorer le service Squad Planner</li>
                  <li>Gérer votre compte et vos préférences</li>
                  <li>Envoyer des notifications et rappels de sessions</li>
                  <li>Calculer le score de fiabilité et la gamification</li>
                  <li>Fournir des suggestions IA personnalisées (Coach IA)</li>
                  <li>Assurer la sécurité et prévenir les abus</li>
                  <li>Gérer les abonnements Premium (via Stripe)</li>
                </ul>
              </Section>

              <Section title="4. Base légale">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-[#f7f8f8]">Exécution du contrat :</strong> traitement nécessaire à la fourniture du service</li>
                  <li><strong className="text-[#f7f8f8]">Consentement :</strong> notifications push, cookies non essentiels</li>
                  <li><strong className="text-[#f7f8f8]">Intérêt légitime :</strong> sécurité, amélioration du service, analytics anonymisées</li>
                </ul>
              </Section>

              <Section title="5. Partage des données">
                <p>Vos données ne sont jamais vendues. Elles sont partagées uniquement avec :</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-[#f7f8f8]">Supabase :</strong> hébergement et base de données (serveurs UE)</li>
                  <li><strong className="text-[#f7f8f8]">Agora :</strong> services d'appels vocaux (données vocales en transit uniquement)</li>
                  <li><strong className="text-[#f7f8f8]">Stripe :</strong> traitement des paiements Premium</li>
                  <li><strong className="text-[#f7f8f8]">Anthropic (Claude) :</strong> suggestions IA (données anonymisées)</li>
                  <li><strong className="text-[#f7f8f8]">Sentry :</strong> monitoring d'erreurs (données techniques uniquement)</li>
                </ul>
              </Section>

              <Section title="6. Conservation des données">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-[#f7f8f8]">Données de compte :</strong> conservées tant que le compte est actif</li>
                  <li><strong className="text-[#f7f8f8]">Messages :</strong> conservés tant que le compte est actif</li>
                  <li><strong className="text-[#f7f8f8]">Logs techniques :</strong> 12 mois maximum</li>
                  <li><strong className="text-[#f7f8f8]">Données de paiement :</strong> gérées et conservées par Stripe selon leur politique</li>
                  <li><strong className="text-[#f7f8f8]">Après suppression du compte :</strong> toutes les données sont effacées sous 30 jours</li>
                </ul>
              </Section>

              <Section title="7. Vos droits (RGPD)">
                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-[#f7f8f8]">Droit d'accès :</strong> consulter toutes vos données personnelles</li>
                  <li><strong className="text-[#f7f8f8]">Droit de rectification :</strong> modifier vos informations depuis votre profil</li>
                  <li><strong className="text-[#f7f8f8]">Droit à l'effacement :</strong> supprimer votre compte et toutes vos données (Paramètres → Supprimer mon compte)</li>
                  <li><strong className="text-[#f7f8f8]">Droit à la portabilité :</strong> exporter vos données au format JSON (Paramètres → Exporter mes données)</li>
                  <li><strong className="text-[#f7f8f8]">Droit d'opposition :</strong> vous opposer au traitement pour les finalités non essentielles</li>
                  <li><strong className="text-[#f7f8f8]">Droit de retrait du consentement :</strong> retirer votre consentement à tout moment (ex: notifications push)</li>
                </ul>
                <p className="mt-3">
                  Pour exercer vos droits, contactez-nous à <span className="text-[#6366f1]">privacy@squadplanner.fr</span> ou
                  utilisez les options disponibles dans les Paramètres de l'application.
                </p>
              </Section>

              <Section title="8. Cookies et stockage local">
                <p>Squad Planner utilise :</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-[#f7f8f8]">Cookies essentiels :</strong> authentification, préférences de thème (obligatoires)</li>
                  <li><strong className="text-[#f7f8f8]">LocalStorage :</strong> état de l'application, cache des données (fonctionnel)</li>
                  <li><strong className="text-[#f7f8f8]">Cookies analytics :</strong> Sentry pour le monitoring d'erreurs (consentement requis)</li>
                </ul>
                <p>
                  Aucun cookie publicitaire n'est utilisé. Vous pouvez gérer vos préférences cookies
                  depuis la bannière de consentement ou les paramètres de votre navigateur.
                </p>
              </Section>

              <Section title="9. Sécurité">
                <p>Nous mettons en œuvre les mesures suivantes pour protéger vos données :</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Chiffrement TLS/SSL pour toutes les communications</li>
                  <li>Mots de passe hashés avec bcrypt (jamais stockés en clair)</li>
                  <li>Row Level Security (RLS) sur la base de données</li>
                  <li>Authentification sécurisée via Supabase Auth</li>
                  <li>Aucun stockage d'enregistrement audio des appels</li>
                </ul>
              </Section>

              <Section title="10. Transferts internationaux">
                <p>
                  Vos données sont principalement hébergées sur des serveurs situés dans l'Union Européenne (Supabase).
                  Certains sous-traitants (Agora, Anthropic, Stripe) peuvent traiter des données hors UE,
                  dans le cadre des clauses contractuelles types approuvées par la Commission Européenne.
                </p>
              </Section>

              <Section title="11. Contact et réclamation">
                <p>
                  Pour toute question relative à vos données personnelles :
                </p>
                <p className="text-[#6366f1]">privacy@squadplanner.fr</p>
                <p className="mt-2">
                  Vous pouvez également introduire une réclamation auprès de la CNIL
                  (Commission Nationale de l'Informatique et des Libertés) : <span className="text-[#6366f1]">www.cnil.fr</span>
                </p>
              </Section>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-[#5e6063]">
            Squad Planner SAS — France
          </p>
        </div>
      </main>
    </div>
  )
}

export default Legal
