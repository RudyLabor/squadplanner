"use client";

import { useState } from 'react'
import { ChevronDown } from '../../components/icons'
import { Card } from '../../components/ui'
import { FAQ } from './PremiumData'

export function PremiumFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="animate-fade-in-up mb-16" style={{ animationDelay: '0.5s' }}>
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">Questions fr&eacute;quentes</h2>
      <div className="space-y-3 max-w-2xl mx-auto">
        {FAQ.map((item, index) => (
          <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${0.5 + index * 0.08}s` }}>
            <Card className="overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full p-4 flex items-center justify-between text-left">
                <span className="text-md font-medium text-text-primary">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="animate-fade-in px-4 pb-4">
                  <p className="text-md text-text-secondary leading-relaxed">{item.a}</p>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
