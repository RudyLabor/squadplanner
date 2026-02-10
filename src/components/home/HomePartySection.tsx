import { memo } from 'react'
import { motion } from 'framer-motion'
import { Mic, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../ui'

interface ActiveParty {
  squadName: string
  participantCount: number
}

function ActivePartyCard({ squadName, participantCount }: ActiveParty) {
  return (
    <Link to="/party">
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card className="p-4 bg-gradient-to-r from-primary/8 to-transparent border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-md font-semibold text-text-primary">
                {participantCount} {participantCount > 1 ? 'potes' : 'pote'} dans {squadName}
              </div>
              <div className="text-base text-text-tertiary">Party vocale en cours</div>
            </div>
            <motion.div
              className="px-4 py-2 rounded-lg bg-primary text-white text-md font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              Rejoindre
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </Link>
  )
}

function PartyCTA() {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
    >
      <Link to="/party" className="block h-full">
        <motion.div
          className="h-full"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card className="p-4 h-full bg-gradient-to-r from-primary/8 to-transparent border-dashed border-primary/20 hover:border-primary/30 hover:shadow-glow-primary-sm transition-interactive">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-10 h-10 rounded-lg bg-primary/12 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: 3 }}
              >
                <Mic className="w-5 h-5 text-primary" />
              </motion.div>
              <div className="flex-1">
                <div className="text-md font-medium text-text-primary">Envie de papoter ?</div>
                <div className="text-sm text-text-tertiary">Lance une party, ta squad est dispo !</div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-quaternary" />
            </div>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  )
}

interface HomePartySectionProps {
  activeParty: ActiveParty | null
  showCTA: boolean
}

export const HomePartySection = memo(function HomePartySection({
  activeParty,
  showCTA,
}: HomePartySectionProps) {
  return (
    <>
      {activeParty && (
        <div>
          <ActivePartyCard
            squadName={activeParty.squadName}
            participantCount={activeParty.participantCount}
          />
        </div>
      )}
      {showCTA && <PartyCTA />}
    </>
  )
})
