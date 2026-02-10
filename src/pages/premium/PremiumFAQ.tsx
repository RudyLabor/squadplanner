import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Card } from '../../components/ui'
import { FAQ } from './PremiumData'

export function PremiumFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">Questions fr&eacute;quentes</h2>
      <div className="space-y-3 max-w-2xl mx-auto">
        {FAQ.map((item, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ delay: index * 0.08, duration: 0.35, ease: 'easeOut' }}>
            <Card className="overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full p-4 flex items-center justify-between text-left">
                <span className="text-md font-medium text-text-primary">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === index && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4">
                  <p className="text-md text-text-secondary leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
