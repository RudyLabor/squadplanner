import { useState } from 'react'
import { ChevronDown } from '../../components/icons'
export function LegalSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const sectionId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return (
    <div id={sectionId} className="border-b border-border-subtle last:border-0 scroll-mt-6">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left group">
        <h3 className="text-md font-semibold text-text-primary group-hover:text-purple transition-colors">{title}</h3>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-md text-text-secondary leading-relaxed space-y-3">{children}</div>
      )}
    </div>
  )
}