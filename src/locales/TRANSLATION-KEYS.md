# Liste complète des clés de traduction

Ce document liste toutes les clés de traduction disponibles dans le système i18n.

## 📌 Navigation (9 clés)

| Clé | FR | EN |
|-----|----|----|
| `nav.home` | Accueil | Home |
| `nav.sessions` | Sessions | Sessions |
| `nav.squads` | Squads | Squads |
| `nav.party` | Party | Party |
| `nav.messages` | Messages | Messages |
| `nav.discover` | Découvrir | Discover |
| `nav.profile` | Profil | Profile |
| `nav.settings` | Paramètres | Settings |
| `nav.help` | Aide | Help |

## 🎬 Actions (24 clés)

| Clé | FR | EN |
|-----|----|----|
| `actions.create` | Créer | Create |
| `actions.edit` | Modifier | Edit |
| `actions.delete` | Supprimer | Delete |
| `actions.cancel` | Annuler | Cancel |
| `actions.save` | Enregistrer | Save |
| `actions.confirm` | Confirmer | Confirm |
| `actions.back` | Retour | Back |
| `actions.next` | Suivant | Next |
| `actions.finish` | Terminer | Finish |
| `actions.close` | Fermer | Close |
| `actions.send` | Envoyer | Send |
| `actions.search` | Rechercher | Search |
| `actions.filter` | Filtrer | Filter |
| `actions.sort` | Trier | Sort |
| `actions.export` | Exporter | Export |
| `actions.import` | Importer | Import |
| `actions.share` | Partager | Share |
| `actions.copy` | Copier | Copy |
| `actions.duplicate` | Dupliquer | Duplicate |
| `actions.archive` | Archiver | Archive |
| `actions.restore` | Restaurer | Restore |
| `actions.download` | Télécharger | Download |
| `actions.upload` | Importer | Upload |
| `actions.preview` | Aperçu | Preview |
| `actions.refresh` | Actualiser | Refresh |
| `actions.retry` | Réessayer | Retry |
| `actions.undo` | Annuler | Undo |
| `actions.redo` | Refaire | Redo |
| `actions.selectAll` | Tout sélectionner | Select all |
| `actions.deselectAll` | Tout désélectionner | Deselect all |

## 🔍 États vides (8 clés)

| Clé | FR | EN |
|-----|----|----|
| `empty.sessions` | Aucune session pour le moment | No sessions yet |
| `empty.squads` | Aucune squad | No squads |
| `empty.messages` | Aucun message | No messages |
| `empty.notifications` | Aucune notification | No notifications |
| `empty.search` | Aucun résultat | No results |
| `empty.friends` | Aucun ami en ligne | No friends online |
| `empty.activities` | Aucune activité récente | No recent activity |
| `empty.challenges` | Aucun défi actif | No active challenges |

## 🟢 Statuts (6 clés)

| Clé | FR | EN |
|-----|----|----|
| `status.online` | En ligne | Online |
| `status.offline` | Hors ligne | Offline |
| `status.away` | Absent | Away |
| `status.busy` | Occupé | Busy |
| `status.inGame` | En jeu | In game |
| `status.inCall` | En appel | In call |

## ⏰ Temps (15 clés dont 6 fonctions)

### Clés simples

| Clé | FR | EN |
|-----|----|----|
| `time.now` | Maintenant | Now |
| `time.today` | Aujourd'hui | Today |
| `time.yesterday` | Hier | Yesterday |
| `time.tomorrow` | Demain | Tomorrow |
| `time.thisWeek` | Cette semaine | This week |
| `time.nextWeek` | Semaine prochaine | Next week |

### Fonctions avec arguments

| Clé | Usage | FR | EN |
|-----|-------|----|----|
| `time.minutesAgo(n)` | `t('time.minutesAgo', 5)` | Il y a 5 min | 5 min ago |
| `time.hoursAgo(n)` | `t('time.hoursAgo', 3)` | Il y a 3h | 3h ago |
| `time.daysAgo(n)` | `t('time.daysAgo', 2)` | Il y a 2j | 2d ago |
| `time.minutes(n)` | `t('time.minutes', 30)` | 30 minutes | 30 minutes |
| `time.hours(n)` | `t('time.hours', 2)` | 2 heures | 2 hours |
| `time.days(n)` | `t('time.days', 7)` | 7 jours | 7 days |

## ❌ Erreurs (8 clés)

| Clé | FR | EN |
|-----|----|----|
| `errors.generic` | Une erreur est survenue | An error occurred |
| `errors.network` | Erreur de connexion | Connection error |
| `errors.unauthorized` | Non autorisé | Unauthorized |
| `errors.notFound` | Introuvable | Not found |
| `errors.validation` | Données invalides | Invalid data |
| `errors.timeout` | Délai d'attente dépassé | Request timeout |
| `errors.offline` | Vous êtes hors ligne | You are offline |
| `errors.serverError` | Erreur serveur | Server error |

## ✅ Succès (6 clés)

| Clé | FR | EN |
|-----|----|----|
| `success.saved` | Enregistré avec succès | Saved successfully |
| `success.deleted` | Supprimé avec succès | Deleted successfully |
| `success.created` | Créé avec succès | Created successfully |
| `success.updated` | Mis à jour avec succès | Updated successfully |
| `success.sent` | Envoyé avec succès | Sent successfully |
| `success.copied` | Copié dans le presse-papiers | Copied to clipboard |

## 🔔 Notifications (8 clés)

| Clé | FR | EN |
|-----|----|----|
| `notifications.title` | Notifications | Notifications |
| `notifications.markAllRead` | Tout marquer comme lu | Mark all as read |
| `notifications.newSession` | Nouvelle session | New session |
| `notifications.sessionReminder` | Rappel de session | Session reminder |
| `notifications.newMessage` | Nouveau message | New message |
| `notifications.newMember` | Nouveau membre | New member |
| `notifications.squadInvite` | Invitation à une squad | Squad invitation |
| `notifications.friendRequest` | Demande d'ami | Friend request |

## 🎮 Sessions (15 clés)

| Clé | FR | EN |
|-----|----|----|
| `sessions.create` | Créer une session | Create session |
| `sessions.edit` | Modifier la session | Edit session |
| `sessions.delete` | Supprimer la session | Delete session |
| `sessions.details` | Détails de la session | Session details |
| `sessions.participants` | Participants | Participants |
| `sessions.game` | Jeu | Game |
| `sessions.datetime` | Date et heure | Date and time |
| `sessions.duration` | Durée | Duration |
| `sessions.recurring` | Récurrente | Recurring |
| `sessions.visibility` | Visibilité | Visibility |
| `sessions.notes` | Notes | Notes |
| `sessions.rsvp.yes` | Je viens | Going |
| `sessions.rsvp.no` | Absent | Not going |
| `sessions.rsvp.maybe` | Peut-être | Maybe |

## 👥 Squads (9 clés dont 1 fonction)

| Clé | FR | EN |
|-----|----|----|
| `squads.create` | Créer une squad | Create squad |
| `squads.edit` | Modifier la squad | Edit squad |
| `squads.delete` | Supprimer la squad | Delete squad |
| `squads.leave` | Quitter la squad | Leave squad |
| `squads.members(n)` | 5 membres | 5 members |
| `squads.invite` | Inviter des membres | Invite members |
| `squads.settings` | Paramètres de la squad | Squad settings |
| `squads.stats` | Statistiques | Statistics |
| `squads.leaderboard` | Classement | Leaderboard |

## 💬 Messages (9 clés)

| Clé | FR | EN |
|-----|----|----|
| `messages.send` | Envoyer un message | Send message |
| `messages.type` | Écris un message... | Type a message... |
| `messages.reply` | Répondre | Reply |
| `messages.edit` | Modifier | Edit |
| `messages.delete` | Supprimer | Delete |
| `messages.react` | Réagir | React |
| `messages.pin` | Épingler | Pin |
| `messages.unpin` | Désépingler | Unpin |
| `messages.thread` | Fil de discussion | Thread |

## ⚙️ Paramètres (50+ clés)

### Général

| Clé | FR | EN |
|-----|----|----|
| `settings.title` | Paramètres | Settings |
| `settings.subtitle` | Personnalise ton expérience | Customize your experience |
| `settings.signOut` | Se déconnecter | Sign out |
| `settings.version` | Squad Planner v1.0.0 | Squad Planner v1.0.0 |
| `settings.saved` | Paramètres sauvegardés | Settings saved |

### Notifications

| Clé | FR | EN |
|-----|----|----|
| `settings.notifications.title` | Notifications | Notifications |
| `settings.notifications.sessions` | Sessions | Sessions |
| `settings.notifications.sessionsDesc` | Rappels et confirmations de sessions | Session reminders and confirmations |
| `settings.notifications.messages` | Messages | Messages |
| `settings.notifications.messagesDesc` | Nouveaux messages de ta squad | New messages from your squad |
| `settings.notifications.party` | Party vocale | Voice party |
| `settings.notifications.partyDesc` | Quand quelqu'un rejoint la party | When someone joins the party |
| `settings.notifications.reminders` | Rappels automatiques | Automatic reminders |
| `settings.notifications.remindersDesc` | 30 min avant chaque session | 30 min before each session |

### Audio

| Clé | FR | EN |
|-----|----|----|
| `settings.audio.title` | Audio | Audio |
| `settings.audio.microphone` | Microphone | Microphone |
| `settings.audio.output` | Sortie audio | Audio output |
| `settings.audio.defaultMic` | Microphone par défaut | Default microphone |
| `settings.audio.defaultOutput` | Haut-parleur par défaut | Default speaker |

### Apparence

| Clé | FR | EN |
|-----|----|----|
| `settings.appearance.title` | Apparence | Appearance |
| `settings.appearance.theme` | Thème | Theme |
| `settings.appearance.themeDesc` | Adapte l'apparence de l'app | Customize the app appearance |
| `settings.appearance.dark` | Sombre | Dark |
| `settings.appearance.light` | Clair | Light |
| `settings.appearance.auto` | Auto | Auto |

### Confidentialité

| Clé | FR | EN |
|-----|----|----|
| `settings.privacy.title` | Confidentialité | Privacy |
| `settings.privacy.profileVisibility` | Visibilité du profil | Profile visibility |
| `settings.privacy.profileVisibilityDesc` | Qui peut voir tes stats | Who can see your stats |
| `settings.privacy.onlineStatus` | Statut en ligne | Online status |
| `settings.privacy.onlineStatusDesc` | Montre quand tu es connecté | Show when you are online |
| `settings.privacy.visibilityOptions.public` | Tout le monde | Everyone |
| `settings.privacy.visibilityOptions.friends` | Membres de mes squads | Squad members |
| `settings.privacy.visibilityOptions.private` | Personne | No one |

### Région

| Clé | FR | EN |
|-----|----|----|
| `settings.region.title` | Région | Region |
| `settings.region.timezone` | Fuseau horaire | Timezone |
| `settings.region.language` | Langue | Language |
| `settings.region.selectTimezone` | Choisis un fuseau horaire | Choose a timezone |

### Données

| Clé | FR | EN |
|-----|----|----|
| `settings.data.title` | Données | Data |
| `settings.data.export` | Exporter mes données | Export my data |
| `settings.data.exportDesc` | Télécharge toutes tes infos (RGPD) | Download all your information (GDPR) |
| `settings.data.exporting` | Export en cours... | Exporting... |
| `settings.data.delete` | Supprimer mon compte | Delete my account |
| `settings.data.deleteDesc` | Action irréversible | Irreversible action |

### Légal

| Clé | FR | EN |
|-----|----|----|
| `settings.legal.title` | Légal | Legal |
| `settings.legal.terms` | Conditions d'utilisation | Terms of service |
| `settings.legal.termsDesc` | CGU de Squad Planner | Squad Planner ToS |
| `settings.legal.privacy` | Politique de confidentialité | Privacy policy |
| `settings.legal.privacyDesc` | RGPD & protection des données | GDPR & data protection |
| `settings.legal.landing` | Page d'accueil publique | Public homepage |
| `settings.legal.landingDesc` | Voir la landing page | View the landing page |

## 💎 Premium (7 clés)

| Clé | FR | EN |
|-----|----|----|
| `premium.title` | Premium | Premium |
| `premium.subtitle` | Débloquez toutes les fonctionnalités | Unlock all features |
| `premium.features.unlimitedSquads` | Squads illimitées | Unlimited squads |
| `premium.features.advancedStats` | Statistiques avancées | Advanced statistics |
| `premium.features.customThemes` | Thèmes personnalisés | Custom themes |
| `premium.features.prioritySupport` | Support prioritaire | Priority support |
| `premium.upgrade` | Passer Premium | Upgrade to Premium |
| `premium.currentPlan` | Votre forfait | Your plan |

## 🔐 Authentification (10 clés)

| Clé | FR | EN |
|-----|----|----|
| `auth.signIn` | Se connecter | Sign in |
| `auth.signUp` | S'inscrire | Sign up |
| `auth.signOut` | Se déconnecter | Sign out |
| `auth.email` | Email | Email |
| `auth.password` | Mot de passe | Password |
| `auth.forgotPassword` | Mot de passe oublié ? | Forgot password? |
| `auth.resetPassword` | Réinitialiser | Reset |
| `auth.welcome` | Bienvenue sur Squad Planner | Welcome to Squad Planner |
| `auth.welcomeBack` | Content de te revoir ! | Welcome back! |

---

## 📊 Statistiques

- **Total des clés:** ~200+
- **Sections:** 14 (nav, actions, empty, status, time, errors, success, notifications, sessions, squads, messages, settings, premium, auth)
- **Fonctions avec arguments:** 7 (time.*, squads.members)
- **Clés Settings:** 50+

## 🔄 Mises à jour

Pour ajouter de nouvelles clés:

1. Mettre à jour `src/locales/fr.ts`
2. Mettre à jour `src/locales/en.ts`
3. Mettre à jour ce document pour référence

---

**Dernière mise à jour:** 2026-02-12
