import { Card } from '../../components/ui'
import { LegalSection } from './LegalSection'

export function CGUContent() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-bold text-text-primary mb-2">
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-md text-text-tertiary">Dernière mise à jour : 8 février 2026</p>
      </div>
      <Card className="p-6 bg-bg-surface">
        <LegalSection title="1. Objet" defaultOpen>
          <p>
            Les présentes Conditions Générales d'Utilisation (CGU) définissent les règles
            d'utilisation de l'application Squad Planner, éditée par Squad Planner SAS.
          </p>
          <p>
            Squad Planner est une application de coordination gaming permettant aux joueurs
            d'organiser des sessions de jeu, de communiquer via chat et appels vocaux, et de suivre
            la fiabilité de leur squad.
          </p>
        </LegalSection>
        <LegalSection title="2. Acceptation des conditions">
          <p>
            En créant un compte sur Squad Planner, vous acceptez sans réserve les présentes CGU. Si
            vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'application.
          </p>
        </LegalSection>
        <LegalSection title="3. Inscription et compte">
          <p>
            L'inscription est gratuite et ouverte à toute personne physique âgée de 13 ans minimum.
            Les mineurs de moins de 16 ans doivent obtenir le consentement de leur représentant
            légal.
          </p>
          <p>
            Vous êtes responsable de la confidentialité de vos identifiants de connexion et de
            toutes les activités réalisées depuis votre compte.
          </p>
          <p>
            Vous vous engagez à fournir des informations exactes et à ne pas usurper l'identité d'un
            tiers.
          </p>
        </LegalSection>
        <LegalSection title="4. Services proposés">
          <ul className="list-disc pl-5 space-y-2">
            <li>Création et gestion de squads (groupes de joueurs)</li>
            <li>Planification de sessions de jeu avec système RSVP</li>
            <li>Chat en temps réel (squad et messages directs)</li>
            <li>Appels vocaux (party vocale et appels 1-to-1)</li>
            <li>Système de fiabilité et gamification</li>
            <li>Coach IA pour optimiser l'organisation</li>
            <li>Notifications push et rappels automatiques</li>
          </ul>
        </LegalSection>
        <LegalSection title="5. Abonnement Premium">
          <p>
            Certaines fonctionnalités avancées sont réservées aux abonnés Premium. L'abonnement est
            proposé en formule mensuelle ou annuelle, avec facturation récurrente via Stripe.
          </p>
          <p>
            Vous pouvez annuler votre abonnement à tout moment depuis les paramètres de
            l'application. L'annulation prend effet à la fin de la période en cours, sans
            remboursement prorata.
          </p>
          <p>Un droit de rétractation de 30 jours est accordé après la première souscription.</p>
        </LegalSection>
        <LegalSection title="6. Comportement de l'utilisateur">
          <p>Vous vous engagez à ne pas :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Publier du contenu illicite, diffamatoire, haineux ou discriminatoire</li>
            <li>Harceler d'autres utilisateurs</li>
            <li>Tenter de compromettre la sécurité de l'application</li>
            <li>Utiliser des bots ou scripts automatisés</li>
            <li>Contourner les mécanismes de limitation ou de gating</li>
          </ul>
          <p>Tout manquement pourra entraîner la suspension ou la suppression de votre compte.</p>
        </LegalSection>
        <LegalSection title="7. Propriété intellectuelle">
          <p>
            L'application Squad Planner, son design, son code source et ses contenus sont protégés
            par le droit de la propriété intellectuelle. Toute reproduction non autorisée est
            interdite.
          </p>
          <p>
            Les contenus que vous publiez (messages, avatar) restent votre propriété. Vous accordez
            à Squad Planner une licence d'utilisation limitée pour le fonctionnement du service.
          </p>
        </LegalSection>
        <LegalSection title="8. Limitation de responsabilité">
          <p>
            Squad Planner est fourni « en l'état ». Nous faisons nos meilleurs efforts pour assurer
            la disponibilité et la sécurité du service, mais ne pouvons garantir une disponibilité à
            100%.
          </p>
          <p>
            Squad Planner ne saurait être tenu responsable des contenus publiés par les utilisateurs
            ni des dommages indirects liés à l'utilisation du service.
          </p>
        </LegalSection>
        <LegalSection title="9. Résiliation">
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application.
            La suppression entraîne l'effacement définitif de toutes vos données personnelles
            conformément au RGPD.
          </p>
          <p>
            Squad Planner se réserve le droit de suspendre ou supprimer un compte en cas de
            violation des présentes CGU.
          </p>
        </LegalSection>
        <LegalSection title="10. Droit applicable">
          <p>
            Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux
            compétents seront ceux de Paris.
          </p>
        </LegalSection>
      </Card>
    </div>
  )
}
