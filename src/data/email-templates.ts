/**
 * Squad Planner Email Templates
 * Lifecycle email system for Resend API integration
 *
 * Brand colors (Obsidian & Violet):
 * - Primary: #8B5CF6 (Violet)
 * - Secondary: #34D399 (Mint)
 * - Error: #F43F5E (Rose)
 * - Background: #0c0c14 (Charcoal)
 * - Cards: #1c1c2e with border #222238
 * - Secondary text: #9ca3af (Gray)
 */

export interface EmailTemplate {
  id: string
  trigger: string
  subject: string | ((vars: Record<string, string>) => string)
  delay: string
  html: (vars: Record<string, string>) => string
}

// ============================================================================
// 1. WELCOME EMAIL
// ============================================================================

const welcome: EmailTemplate = {
  id: 'welcome',
  trigger: 'user_signup',
  subject: 'Bienvenue sur Squad Planner ! 🎮',
  delay: '1d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Squad Planner</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px;">
              <!-- Greeting -->
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                Bienvenue, ${vars.name || 'Champion'} ! 🎮
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Merci de rejoindre la plus grande communauté de planification de sessions gaming
              </p>

              <!-- Main message -->
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Tu es maintenant prêt à créer ta squad, inviter tes potes et planifier vos sessions ensemble. Commençons dès maintenant !
              </p>

              <!-- Three action cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <!-- Action 1 -->
                <tr>
                  <td style="padding: 15px 0;">
                    <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; text-align: center;">
                      <div style="font-size: 28px; margin-bottom: 10px;">👥</div>
                      <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Crée ta squad</h3>
                      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Réunis tes potes et commencez ensemble</p>
                    </div>
                  </td>
                </tr>

                <!-- Action 2 -->
                <tr>
                  <td style="padding: 15px 0;">
                    <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; text-align: center;">
                      <div style="font-size: 28px; margin-bottom: 10px;">📧</div>
                      <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Invite tes potes</h3>
                      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Envoie-leur un lien et fais-les rejoindre</p>
                    </div>
                  </td>
                </tr>

                <!-- Action 3 -->
                <tr>
                  <td style="padding: 15px 0;">
                    <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; text-align: center;">
                      <div style="font-size: 28px; margin-bottom: 10px;">📅</div>
                      <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Planifie ta première session</h3>
                      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Mets en place votre premier jeu ensemble</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/squads/create" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Crée ta première squad</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// 2. INVITE FRIENDS EMAIL
// ============================================================================

const inviteFriends: EmailTemplate = {
  id: 'invite_friends',
  trigger: 'light_inactivity',
  subject: 'Invite tes amis et gagne 7 jours Premium 🎁',
  delay: '3d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invite tes amis et gagne Premium</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px;">
              <!-- Header -->
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                Invite tes amis 🎁
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Et gagne 7 jours de Premium gratuit
              </p>

              <!-- Main message -->
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Partage Squad Planner avec tes potes et obtenez des récompenses. Plus tu invites de personnes, plus tu gagnes !
              </p>

              <!-- How it works section -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Comment ça marche ?</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <!-- Step 1 -->
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #404050;">
                      <div style="display: flex; align-items: flex-start;">
                        <div style="background-color: #8B5CF6; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; margin-right: 12px;">1</div>
                        <div>
                          <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Partage ton lien de parrainage</p>
                          <p style="color: #9ca3af; font-size: 13px; margin: 0;">Envoie-le à tes potes par Discord, email ou autre</p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Step 2 -->
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #404050;">
                      <div style="display: flex; align-items: flex-start;">
                        <div style="background-color: #8B5CF6; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; margin-right: 12px;">2</div>
                        <div>
                          <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Ils rejoignent Squad Planner</p>
                          <p style="color: #9ca3af; font-size: 13px; margin: 0;">Ils s'inscrivent avec ton lien de parrainage</p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Step 3 -->
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: flex-start;">
                        <div style="background-color: #8B5CF6; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; margin-right: 12px;">3</div>
                        <div>
                          <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Vous gagnez tous les deux</p>
                          <p style="color: #9ca3af; font-size: 13px; margin: 0;">Vous obtenez 7 jours Premium gratuit chacun</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Rewards section -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Récompenses</h3>
                <p style="color: #e5e7eb; font-size: 14px; margin: 0 0 12px 0;">
                  <strong>Toi :</strong> 7 jours Premium par parrainage réussi
                </p>
                <p style="color: #e5e7eb; font-size: 14px; margin: 0;">
                  <strong>Eux :</strong> 7 jours Premium pour leur première adhésion
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/referrals" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Inviter mes amis</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// 3. SESSION MISSED EMAIL
// ============================================================================

const sessionMissed: EmailTemplate = {
  id: 'session_missed',
  trigger: 'missed_sessions',
  subject: 'Tu as manqué 3 sessions cette semaine 😬',
  delay: '7d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tu as manqué 3 sessions</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px;">
              <!-- Header -->
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                Gentle reminder 😬
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Tu as manqué 3 sessions cette semaine
              </p>

              <!-- Main message -->
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Tes potes comptent sur toi ! Les membres fiables sont la clé d'une bonne squad. Chaque session manquée impacte la fiabilité de votre groupe et rend plus difficile la planification future.
              </p>

              <!-- Impact card -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">L'impact sur ta squad</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 50%; padding-right: 10px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Ta fiabilité</p>
                        <p style="color: #ef4444; font-size: 24px; font-weight: 700; margin: 0;">62%</p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">↓ -15% cette semaine</p>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 10px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Confiance squad</p>
                        <p style="color: #f59e0b; font-size: 24px; font-weight: 700; margin: 0;">71%</p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">↓ -8% cette semaine</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Call to action message -->
              <p style="color: #e5e7eb; font-size: 14px; line-height: 1.6; margin: 25px 0;">
                C'est pas trop tard ! Rejoins ta squad et rattrape-toi. Tes potes te remercieront 🙏
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/sessions" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Voir mes sessions</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// 4. SQUAD PLAYING EMAIL (FOMO)
// ============================================================================

const squadPlaying: EmailTemplate = {
  id: 'squad_playing',
  trigger: 'extended_inactivity',
  subject: 'Ta squad a joué sans toi ! 🎮',
  delay: '14d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ta squad a joué sans toi</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px;">
              <!-- Header -->
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                Tu nous manques ! 🎮
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Ta squad a joué sans toi ces derniers jours
              </p>

              <!-- Main message -->
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Les gars se sont rassemblés et ils ont déjà quelques sessions au compteur. Pas de panique, tu peux encore les rattraper !
              </p>

              <!-- Recent sessions -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Sessions récentes</h3>

                <!-- Session 1 -->
                <div style="border-bottom: 1px solid #404050; padding-bottom: 12px; margin-bottom: 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 100%;">
                        <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">🎮 Valorant — Session 5v5</p>
                        <p style="color: #9ca3af; font-size: 13px; margin: 0;">Avec Alex, Jordan, Maya — Il y a 2 jours</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Session 2 -->
                <div style="border-bottom: 1px solid #404050; padding-bottom: 12px; margin-bottom: 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 100%;">
                        <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">🎮 CS2 — Competitive Match</p>
                        <p style="color: #9ca3af; font-size: 13px; margin: 0;">Avec Alex, Sam, Casey — Il y a 1 jour</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Session 3 -->
                <div style="padding-bottom: 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 100%;">
                        <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">🎮 Fortnite — Squad Battle Royale</p>
                        <p style="color: #9ca3af; font-size: 13px; margin: 0;">Avec Jordan, Maya, Casey — Aujourd'hui</p>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- Squad stats -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Ce que tu as manqué</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 50%; padding-right: 10px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 6px 0;">Sessions jouées</p>
                      <p style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0;">3</p>
                    </td>
                    <td style="width: 50%; padding-left: 10px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 6px 0;">Heures jouées</p>
                      <p style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0;">8h 47m</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/squads/${vars.squad_id || 'dashboard'}" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Rejoindre ma squad</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// 5. TRIAL ENDING EMAIL
// ============================================================================

const trialEnding: EmailTemplate = {
  id: 'trial_ending',
  trigger: 'trial_ending_soon',
  subject: 'Ton essai Premium se termine dans 3 jours ⏰',
  delay: '-3d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ton essai Premium se termine</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px;">
              <!-- Warning banner -->
              <div style="background-color: #7c2d12; border: 1px solid #b45309; border-radius: 8px; padding: 15px; margin: 0 0 30px 0; text-align: center;">
                <p style="color: #fef3c7; font-size: 14px; font-weight: 600; margin: 0;">⏰ Ton essai Premium se termine dans 3 jours</p>
              </div>

              <!-- Header -->
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                Profite encore un peu ! 🚀
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Tu adores Squad Planner. Ne pars pas maintenant !
              </p>

              <!-- What you'll lose -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Si tu quittes Premium, tu perds</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <p style="color: #e5e7eb; font-size: 14px; margin: 0;">📊 Stats avancées de ta squad</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <p style="color: #e5e7eb; font-size: 14px; margin: 0;">📈 Graphiques de progression détaillés</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <p style="color: #e5e7eb; font-size: 14px; margin: 0;">🎯 Analyses de performance en profondeur</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <p style="color: #e5e7eb; font-size: 14px; margin: 0;">🏆 Badges et réalisations exclusives</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <p style="color: #e5e7eb; font-size: 14px; margin: 0;">💬 Support prioritaire</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Premium features -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Pourquoi Premium ?</h3>
                <ul style="color: #e5e7eb; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Suive ta progression en détail avec des graphiques magnifiques</li>
                  <li style="margin-bottom: 8px;">Reçois des recommandations personnalisées pour améliorer ta squad</li>
                  <li style="margin-bottom: 8px;">Accès aux événements exclusifs et tournaments Premium</li>
                  <li>Support en priorité pour tes questions et problèmes</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/premium" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Garder mon Premium</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// 6. TRIAL ENDED EMAIL
// ============================================================================

const trialEnded: EmailTemplate = {
  id: 'trial_ended',
  trigger: 'trial_ended',
  subject: "Tu as perdu l'accès à tes stats avancées 📊",
  delay: '1d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ton essai Premium a expiré</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px;">
              <!-- Header -->
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                C'est la fin de l'aventure Premium 📊
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Ton essai Premium a expiré, mais une surprise t'attend
              </p>

              <!-- Main message -->
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Malheureusement, ton accès Premium a expiré. Les features avancées comme tes statistiques détaillées et tes analyses de performance ne sont plus disponibles.
              </p>

              <!-- What changed -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Ce qui a changé</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">❌ Stats avancées</p>
                      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Maintenant masquées et verrouillées</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">❌ Graphiques détaillés</p>
                      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Seules les stats basiques sont disponibles</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">❌ Support prioritaire</p>
                      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Tu es revenu au support standard</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Special offer -->
              <div style="background-color: #1e3a1f; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">🎁 Offre spéciale pour toi</h3>
                <p style="color: #e5e7eb; font-size: 14px; margin: 0 0 10px 0;">
                  Récupère ton Premium avec une réduction exclusive de <strong>-20%</strong>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Cette offre n'est valable que 7 jours
                </p>
              </div>

              <!-- Price comparison -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Prix habituels</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 50%; padding-right: 10px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 6px 0;">Prix normal</p>
                        <p style="color: #ef4444; font-size: 20px; font-weight: 700; text-decoration: line-through; margin: 0;">4,99€/mois</p>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 10px;">
                      <div style="background-color: #1e3a1f; border: 1px solid #10b981; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #10b981; font-size: 12px; font-weight: 600; margin: 0 0 6px 0;">POUR TOI MAINTENANT</p>
                        <p style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0;">3,99€/mois</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/premium?discount=20" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Récupérer mon Premium — -20%</a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
                Cette offre expire dans 7 jours
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// 7. MONTHLY DIGEST EMAIL
// ============================================================================

const monthlyDigest: EmailTemplate = {
  id: 'monthly_digest',
  trigger: 'monthly',
  subject: 'Ton récap du mois 📈',
  delay: '0d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ton récap mensuel</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px;">
              <!-- Header -->
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                Ton récap du mois 📈
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Février 2026 — Tu as été en feu ! 🔥
              </p>

              <!-- Stats overview -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 20px 0;">Tes stats du mois</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 50%; padding-right: 8px; padding-bottom: 12px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Sessions jouées</p>
                        <p style="color: #8B5CF6; font-size: 32px; font-weight: 700; margin: 0;">${vars.sessions_count || '12'}</p>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 8px; padding-bottom: 12px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Heures jouées</p>
                        <p style="color: #10b981; font-size: 32px; font-weight: 700; margin: 0;">${vars.hours_played || '48'}h</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; padding-right: 8px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Fiabilité</p>
                        <p style="color: #f59e0b; font-size: 32px; font-weight: 700; margin: 0;">${vars.reliability || '92'}%</p>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 8px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">XP gagnés</p>
                        <p style="color: #ec4899; font-size: 32px; font-weight: 700; margin: 0;">+${vars.xp_gained || '3450'}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Squad activity -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Activité de ta squad</h3>
                <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">
                  ${vars.squad_name || 'Les Légendaires'}
                </p>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 50%; padding-right: 8px;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0;">Membres actifs</p>
                      <p style="color: #e5e7eb; font-size: 16px; font-weight: 600; margin: 0;">5/5</p>
                    </td>
                    <td style="width: 50%; padding-left: 8px;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0;">Confiance squad</p>
                      <p style="color: #e5e7eb; font-size: 16px; font-weight: 600; margin: 0;">95%</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Game breakdown -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Jeux les plus joués</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <!-- Game 1 -->
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 70%;">
                            <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0;">Valorant</p>
                          </td>
                          <td style="width: 30%; text-align: right;">
                            <p style="color: #8B5CF6; font-size: 14px; font-weight: 600; margin: 0;">18h 30m</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Game 2 -->
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #404050;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 70%;">
                            <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0;">CS2</p>
                          </td>
                          <td style="width: 30%; text-align: right;">
                            <p style="color: #8B5CF6; font-size: 14px; font-weight: 600; margin: 0;">15h 20m</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Game 3 -->
                  <tr>
                    <td style="padding: 10px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 70%;">
                            <p style="color: #e5e7eb; font-size: 14px; font-weight: 600; margin: 0;">Fortnite</p>
                          </td>
                          <td style="width: 30%; text-align: right;">
                            <p style="color: #8B5CF6; font-size: 14px; font-weight: 600; margin: 0;">14h 10m</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/stats" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Voir mes stats</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// 8. ANNIVERSARY EMAIL
// ============================================================================

const anniversary: EmailTemplate = {
  id: 'anniversary',
  trigger: 'user_anniversary',
  subject: '1 an avec Squad Planner 🎂 -30% pour toi',
  delay: '0d',
  html: (vars) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>1 an avec Squad Planner</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background-color: #0c0c14; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <!-- Header with logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0;">
              <img src="https://squadplanner.fr/logo.png" alt="Squad Planner" style="height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background-color: #1c1c2e; border: 1px solid #222238; border-radius: 12px; padding: 40px 30px; text-align: center;">
              <!-- Celebration emoji -->
              <div style="font-size: 48px; margin-bottom: 20px;">🎂</div>

              <!-- Header -->
              <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3;">
                1 an d'aventures ! 🎉
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 30px 0;">
                Merci d'avoir choisi Squad Planner
              </p>

              <!-- Main message -->
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: left;">
                Cela fait 1 an que tu as rejoint notre communauté et c'est incroyable de voir combien tu as grandi avec nous. De tes premières sessions à ta squad actuelle, ton parcours a été inspirant.
              </p>

              <!-- Stats recap -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: left;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">Ton bilan annuel</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 50%; padding-right: 8px; padding-bottom: 12px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Sessions totales</p>
                        <p style="color: #8B5CF6; font-size: 28px; font-weight: 700; margin: 0;">142</p>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 8px; padding-bottom: 12px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Heures jouées</p>
                        <p style="color: #10b981; font-size: 28px; font-weight: 700; margin: 0;">487h</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; padding-right: 8px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">XP total</p>
                        <p style="color: #ec4899; font-size: 28px; font-weight: 700; margin: 0;">42.5K</p>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 8px;">
                      <div style="background-color: #1c1c2e; border: 1px solid #404050; border-radius: 6px; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Fiabilité moyenne</p>
                        <p style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 0;">88%</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Celebration message -->
              <div style="background-color: #1e3a1f; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <h3 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">Merci pour cette belle année ! 🙏</h3>
                <p style="color: #e5e7eb; font-size: 14px; margin: 0;">
                  Pour fêter ça, on t'offre <strong>-30% sur l'annuel Premium</strong>
                </p>
              </div>

              <!-- Premium offer -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Offre anniversaire spéciale</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0;">Abonnement annuel</p>
                      <p style="color: #ef4444; font-size: 18px; text-decoration: line-through; margin: 0 0 6px 0;">49,99€/an</p>
                      <p style="color: #10b981; font-size: 28px; font-weight: 700; margin: 0;">34,99€/an</p>
                      <p style="color: #10b981; font-size: 12px; font-weight: 600; margin: 5px 0 0 0;">-30% 🎁</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- What you get -->
              <div style="background-color: #222238; border: 1px solid #404050; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: left;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Avec Premium, tu accèdes à</h3>

                <ul style="color: #e5e7eb; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">📊 Statistiques avancées et graphiques détaillés</li>
                  <li style="margin-bottom: 8px;">📈 Analyses de performance personnalisées</li>
                  <li style="margin-bottom: 8px;">🏆 Badges et réalisations exclusives</li>
                  <li style="margin-bottom: 8px;">💬 Support prioritaire 24/7</li>
                  <li>🎯 Recommandations IA pour améliorer ta squad</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://squadplanner.fr/premium?discount=anniversary30" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Profiter de -30%</a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
                Offre valable jusqu'au 20 mars 2026
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2026 Squad Planner. Tous droits réservés.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #8B5CF6; text-decoration: none;">Se désabonner</a> ·
                <a href="https://squadplanner.fr/privacy" style="color: #8B5CF6; text-decoration: none;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `,
}

// ============================================================================
// EXPORTS
// ============================================================================

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  welcome,
  inviteFriends,
  sessionMissed,
  squadPlaying,
  trialEnding,
  trialEnded,
  monthlyDigest,
  anniversary,
]

/**
 * Get a template by ID
 */
export function getTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((template) => template.id === id)
}

/**
 * Render a template with variables and return subject + HTML
 */
export function renderTemplate(
  id: string,
  vars: Record<string, string> = {}
): { subject: string; html: string } | null {
  const template = getTemplate(id)
  if (!template) {
    return null
  }

  const subject = typeof template.subject === 'function' ? template.subject(vars) : template.subject
  const html = template.html(vars)

  return { subject, html }
}
