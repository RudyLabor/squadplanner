import { Card } from '../../components/ui'
import { LegalSection } from './LegalSection'

export function PrivacyContent() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-bold text-text-primary mb-2">Politique de Confidentialité</h1>
        <p className="text-md text-text-tertiary">Dernière mise à jour : 8 février 2026</p>
      </div>
      <Card className="p-6 bg-bg-surface">
        <LegalSection title="1. Responsable du traitement" defaultOpen>
          <p>
            Le responsable du traitement des données personnelles est Squad Planner SAS, dont le
            siège social est situé en France.
          </p>
          <p>Contact : privacy@squadplanner.fr</p>
        </LegalSection>
        <LegalSection title="2. Données collectées">
          <p>Nous collectons les données suivantes :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-primary">Données d'inscription :</strong> email, pseudo,
              mot de passe (hashé), avatar
            </li>
            <li>
              <strong className="text-text-primary">Données de profil :</strong> fuseau horaire,
              préférences de langue
            </li>
            <li>
              <strong className="text-text-primary">Données d'utilisation :</strong> sessions
              planifiées, RSVP, check-ins, score de fiabilité
            </li>
            <li>
              <strong className="text-text-primary">Messages :</strong> contenus des messages squad
              et DM (chiffrés en transit)
            </li>
            <li>
              <strong className="text-text-primary">Données techniques :</strong> logs de connexion,
              type de navigateur, adresse IP (anonymisée)
            </li>
            <li>
              <strong className="text-text-primary">Appels vocaux :</strong> métadonnées (durée,
              participants), pas d'enregistrement audio
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="3. Finalités du traitement">
          <ul className="list-disc pl-5 space-y-2">
            <li>Fournir et améliorer le service Squad Planner</li>
            <li>Gérer votre compte et vos préférences</li>
            <li>Envoyer des notifications et rappels de sessions</li>
            <li>Calculer le score de fiabilité et la gamification</li>
            <li>Fournir des suggestions IA personnalisées (Coach IA)</li>
            <li>Assurer la sécurité et prévenir les abus</li>
            <li>Gérer les abonnements Premium (via Stripe)</li>
          </ul>
        </LegalSection>
        <LegalSection title="4. Base légale">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-primary">Exécution du contrat :</strong> traitement
              nécessaire à la fourniture du service
            </li>
            <li>
              <strong className="text-text-primary">Consentement :</strong> notifications push,
              cookies non essentiels
            </li>
            <li>
              <strong className="text-text-primary">Intérêt légitime :</strong> sécurité,
              amélioration du service, analytics anonymisées
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="5. Partage des données">
          <p>Vos données ne sont jamais vendues. Elles sont partagées uniquement avec :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-primary">Supabase :</strong> hébergement et base de
              données (serveurs UE)
            </li>
            <li>
              <strong className="text-text-primary">LiveKit :</strong> services d'appels vocaux
              (données vocales en transit uniquement, open source)
            </li>
            <li>
              <strong className="text-text-primary">Stripe :</strong> traitement des paiements
              Premium
            </li>
            <li>
              <strong className="text-text-primary">Anthropic (Claude) :</strong> suggestions IA
              (données anonymisées)
            </li>
            <li>
              <strong className="text-text-primary">Monitoring d'erreurs :</strong> service interne
              (données techniques uniquement)
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="6. Conservation des données">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-primary">Données de compte :</strong> conservées tant que
              le compte est actif
            </li>
            <li>
              <strong className="text-text-primary">Messages :</strong> conservés tant que le compte
              est actif
            </li>
            <li>
              <strong className="text-text-primary">Logs techniques :</strong> 12 mois maximum
            </li>
            <li>
              <strong className="text-text-primary">Données de paiement :</strong> gérées et
              conservées par Stripe selon leur politique
            </li>
            <li>
              <strong className="text-text-primary">Après suppression du compte :</strong> toutes
              les données sont effacées sous 30 jours
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="7. Vos droits (RGPD)">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-primary">Droit d'accès :</strong> consulter toutes vos
              données personnelles
            </li>
            <li>
              <strong className="text-text-primary">Droit de rectification :</strong> modifier vos
              informations depuis votre profil
            </li>
            <li>
              <strong className="text-text-primary">Droit à l'effacement :</strong> supprimer votre
              compte et toutes vos données (Paramètres → Supprimer mon compte)
            </li>
            <li>
              <strong className="text-text-primary">Droit à la portabilité :</strong> exporter vos
              données au format JSON (Paramètres → Exporter mes données)
            </li>
            <li>
              <strong className="text-text-primary">Droit d'opposition :</strong> vous opposer au
              traitement pour les finalités non essentielles
            </li>
            <li>
              <strong className="text-text-primary">Droit de retrait du consentement :</strong>{' '}
              retirer votre consentement à tout moment (ex: notifications push)
            </li>
          </ul>
          <p className="mt-3">
            Pour exercer vos droits, contactez-nous à{' '}
            <span className="text-primary">privacy@squadplanner.fr</span> ou utilisez les options
            disponibles dans les Paramètres de l'application.
          </p>
        </LegalSection>
        <LegalSection title="8. Cookies et stockage local">
          <p>Squad Planner utilise :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-text-primary">Cookies essentiels :</strong> authentification,
              préférences de thème (obligatoires)
            </li>
            <li>
              <strong className="text-text-primary">LocalStorage :</strong> état de l'application,
              cache des données (fonctionnel)
            </li>
            <li>
              <strong className="text-text-primary">Cookies analytics :</strong> monitoring
              d'erreurs anonymisé (consentement requis)
            </li>
          </ul>
          <p>
            Aucun cookie publicitaire n'est utilisé. Vous pouvez gérer vos préférences cookies
            depuis la bannière de consentement ou les paramètres de votre navigateur.
          </p>
        </LegalSection>
        <LegalSection title="9. Sécurité">
          <p>Nous mettons en œuvre les mesures suivantes pour protéger vos données :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Chiffrement TLS/SSL pour toutes les communications</li>
            <li>Mots de passe hashés avec bcrypt (jamais stockés en clair)</li>
            <li>Row Level Security (RLS) sur la base de données</li>
            <li>Authentification sécurisée via Supabase Auth</li>
            <li>Aucun stockage d'enregistrement audio des appels</li>
          </ul>
        </LegalSection>
        <LegalSection title="10. Transferts internationaux">
          <p>
            Vos données sont principalement hébergées sur des serveurs situés dans l'Union
            Européenne (Supabase). Certains sous-traitants (LiveKit, Anthropic, Stripe) peuvent
            traiter des données hors UE, dans le cadre des clauses contractuelles types approuvées
            par la Commission Européenne.
          </p>
        </LegalSection>
        <LegalSection title="11. Contact et réclamation">
          <p>Pour toute question relative à vos données personnelles :</p>
          <p className="text-primary">privacy@squadplanner.fr</p>
          <p className="mt-2">
            Vous pouvez également introduire une réclamation auprès de la CNIL (Commission Nationale
            de l'Informatique et des Libertés) : <span className="text-primary">www.cnil.fr</span>
          </p>
        </LegalSection>
      </Card>
    </div>
  )
}
