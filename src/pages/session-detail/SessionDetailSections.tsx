import { motion } from 'framer-motion'
import {
  Calendar, Clock, Users, Check, X, HelpCircle,
  CheckCircle2, Loader2, Gamepad2
} from 'lucide-react'
import { Button, Card, CardContent, Badge } from '../../components/ui'

type RsvpResponse = 'present' | 'absent' | 'maybe'

interface SessionInfoCardsProps {
  dateInfo: { day: string; time: string }
  durationMinutes: number
}

export function SessionInfoCards({ dateInfo, durationMinutes }: SessionInfoCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/[0.075] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-warning" />
          </div>
          <div>
            <div className="text-md font-medium text-text-primary capitalize">{dateInfo.day}</div>
            <div className="text-base text-text-secondary">{dateInfo.time}</div>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-info" />
          </div>
          <div>
            <div className="text-md font-medium text-text-primary">{durationMinutes} min</div>
            <div className="text-base text-text-secondary">Durée</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

interface RsvpCountsProps {
  present: number
  maybe: number
  absent: number
}

export function RsvpCounts({ present, maybe, absent }: RsvpCountsProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-medium text-text-tertiary/35 uppercase tracking-[0.05em] mb-4">Réponses</h2>
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <Card className="p-4 lg:p-5 text-center">
          <Check className="w-5 h-5 mx-auto mb-2 text-success" />
          <div className="text-lg lg:text-xl font-bold text-text-primary">{present}</div>
          <div className="text-sm text-text-tertiary">Présents</div>
        </Card>
        <Card className="p-4 lg:p-5 text-center">
          <HelpCircle className="w-5 h-5 mx-auto mb-2 text-warning" />
          <div className="text-lg lg:text-xl font-bold text-text-primary">{maybe}</div>
          <div className="text-sm text-text-tertiary">Peut-être</div>
        </Card>
        <Card className="p-4 lg:p-5 text-center">
          <X className="w-5 h-5 mx-auto mb-2 text-error" />
          <div className="text-lg lg:text-xl font-bold text-text-primary">{absent}</div>
          <div className="text-sm text-text-tertiary">Absents</div>
        </Card>
      </div>
    </div>
  )
}

interface RsvpButtonsProps {
  myRsvp?: string
  rsvpLoading: RsvpResponse | null
  onRsvp: (response: RsvpResponse) => void
}

export function RsvpButtons({ myRsvp, rsvpLoading, onRsvp }: RsvpButtonsProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-medium text-text-tertiary/35 uppercase tracking-[0.05em] mb-4">Ta réponse</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button variant={myRsvp === 'present' ? 'primary' : 'secondary'}
                className={`w-full ${myRsvp === 'present' ? 'shadow-glow-success ring-2 ring-success/15' : ''}`}
                onClick={() => onRsvp('present')} disabled={rsvpLoading !== null}>
                {rsvpLoading === 'present' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Présent
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button variant={myRsvp === 'maybe' ? 'primary' : 'secondary'}
                className={`w-full ${myRsvp === 'maybe' ? 'shadow-glow-warning ring-2 ring-warning/15' : ''}`}
                onClick={() => onRsvp('maybe')} disabled={rsvpLoading !== null}>
                {rsvpLoading === 'maybe' ? <Loader2 className="w-5 h-5 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                Peut-être
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button variant={myRsvp === 'absent' ? 'danger' : 'secondary'} className="w-full"
                onClick={() => onRsvp('absent')} disabled={rsvpLoading !== null}>
                {rsvpLoading === 'absent' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Absent
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface CheckinSectionProps {
  checkinLoading: boolean
  onCheckin: () => void
}

export function CheckinSection({ checkinLoading, onCheckin }: CheckinSectionProps) {
  return (
    <div className="mb-8">
      <Card className="p-6 text-center bg-gradient-to-b from-success/[0.075] to-transparent border-success/15 relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-success/[0.025]"
          animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 2, repeat: 3 }} />
        <div className="relative">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: 3 }}>
            <Gamepad2 className="w-14 h-14 mx-auto mb-4 text-success" />
          </motion.div>
          <h3 className="text-lg font-bold text-text-primary mb-2">🎮 C'est l'heure du game !</h3>
          <p className="text-text-secondary mb-5">Ta squad t'attend. Confirme que t'es là !</p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={onCheckin} disabled={checkinLoading}
              className="h-12 px-8 bg-success hover:bg-success text-bg-base font-semibold shadow-glow-success">
              {checkinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Je suis là !
            </Button>
          </motion.div>
        </div>
      </Card>
    </div>
  )
}

interface ParticipantsListProps {
  rsvps?: Array<{
    user_id: string
    response: string
    profiles?: { username?: string }
  }>
  checkins?: Array<{ user_id: string }>
}

export function ParticipantsList({ rsvps, checkins }: ParticipantsListProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-medium text-text-tertiary/35 uppercase tracking-[0.05em] mb-4">Participants</h2>
      <Card>
        <CardContent className="p-4 space-y-3">
          {rsvps?.map((rsvp) => {
            const hasCheckedin = checkins?.some(c => c.user_id === rsvp.user_id)
            return (
              <div key={rsvp.user_id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple/[0.075] flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple" />
                </div>
                <div className="flex-1">
                  <span className="text-md text-text-primary">
                    {(rsvp as { profiles?: { username?: string } }).profiles?.username || 'Joueur'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasCheckedin && <Badge variant="success">Check-in ✓</Badge>}
                  <Badge variant={rsvp.response === 'present' ? 'success' : rsvp.response === 'maybe' ? 'warning' : 'danger'}>
                    {rsvp.response === 'present' ? 'Présent' : rsvp.response === 'maybe' ? 'Peut-être' : 'Absent'}
                  </Badge>
                </div>
              </div>
            )
          })}
          {(!rsvps || rsvps.length === 0) && (
            <p className="text-center text-text-secondary py-4">Aucune réponse pour l'instant</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
