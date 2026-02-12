import { m } from 'framer-motion'
import { Mic, Users } from '../../components/icons'
import { Link } from 'react-router'
import { Card, Button } from '../../components/ui'

export function PartyEmptyState() {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-8 text-center bg-gradient-to-br from-primary/[0.08] to-transparent border-primary">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <m.div
            className="absolute inset-0 rounded-2xl bg-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <m.div
            className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-md shadow-primary/15"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Mic className="w-8 h-8 text-white" strokeWidth={1.5} />
          </m.div>
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">Parle avec ta squad</h3>
        <p className="text-md text-text-secondary mb-6 max-w-[280px] mx-auto leading-relaxed">
          Cr&eacute;e ou rejoins une squad pour lancer des parties vocales avec tes potes.
        </p>
        <Link to="/squads">
          <Button className="shadow-md shadow-primary/10">
            <Users className="w-4 h-4" /> Trouver une squad
          </Button>
        </Link>
      </Card>
    </m.div>
  )
}
