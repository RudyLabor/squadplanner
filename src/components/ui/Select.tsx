"use client";

import { type ReactNode, useState, useRef, useEffect, useCallback, useMemo, useId } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  X,
  Search,
  Loader2,
  Check,
} from '../icons'
import { haptic } from '../../utils/haptics'

export interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
  group?: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string | string[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  searchable?: boolean
  multiple?: boolean
  clearable?: boolean
  loading?: boolean
  disabled?: boolean
  error?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  emptyMessage?: string
}

const sizes = {
  sm: { h: 'h-9', text: 'text-sm', tag: 'text-xs px-1.5 py-0.5' },
  md: { h: 'h-11', text: 'text-sm', tag: 'text-xs px-2 py-0.5' },
  lg: { h: 'h-12', text: 'text-base', tag: 'text-sm px-2 py-1' },
} as const

export function Select({
  options, value, onChange, placeholder = 'Select...', searchable = false,
  multiple = false, clearable = false, loading = false, disabled = false,
  error, label, size = 'md', emptyMessage = 'No results found',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const optRefs = useRef<(HTMLDivElement | null)[]>([])
  const labelId = useId()
  const listboxId = useId()
  const cfg = sizes[size]

  const selected = useMemo(() => !value ? [] : Array.isArray(value) ? value : [value], [value])

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q))
  }, [options, search])

  const grouped = useMemo(() => {
    const m = new Map<string, SelectOption[]>()
    for (const o of filtered) { const k = o.group ?? ''; m.set(k, [...(m.get(k) ?? []), o]) }
    return m
  }, [filtered])

  const flat = useMemo(() => filtered.filter((o) => !o.disabled), [filtered])

  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ x: r.left, y: r.bottom + 4, w: r.width })
      requestAnimationFrame(() => searchRef.current?.focus())
    } else { setSearch(''); setActiveIdx(-1) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !listRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (activeIdx >= 0) optRefs.current[activeIdx]?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const selectOpt = useCallback((val: string) => {
    try { haptic.selection() } catch {}
    if (multiple) {
      onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
    } else { onChange(val); setOpen(false) }
  }, [multiple, selected, onChange])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); return }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); setOpen(true); return }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => i < flat.length - 1 ? i + 1 : 0); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => i > 0 ? i - 1 : flat.length - 1); return }
    if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0 && flat[activeIdx]) selectOpt(flat[activeIdx].value); return }
    if (e.key === 'Backspace' && !search && multiple && selected.length > 0) { e.preventDefault(); onChange(selected.slice(0, -1)) }
  }, [open, activeIdx, flat, search, multiple, selected, onChange, selectOpt])

  const displayLabel = !multiple && selected.length === 1 ? options.find((o) => o.value === selected[0])?.label : null
  optRefs.current = []

  return (
    <div className="relative">
      {label && <label id={labelId} className="block mb-1.5 text-sm font-medium text-text-secondary">{label}</label>}
      <div
        ref={triggerRef} tabIndex={disabled ? -1 : 0} role="combobox" aria-expanded={open}
        aria-haspopup="listbox" aria-controls={open ? listboxId : undefined}
        aria-labelledby={label ? labelId : undefined} aria-disabled={disabled} aria-invalid={!!error}
        onClick={() => !disabled && setOpen((v) => !v)} onKeyDown={handleKey}
        className={`flex items-center gap-2 w-full px-3 ${cfg.h} ${cfg.text} rounded-xl border cursor-pointer transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed bg-bg-surface border-border-subtle'
            : error ? 'bg-surface-input border-error/30 hover:border-error/50'
            : open ? 'bg-surface-input border-primary ring-2 ring-primary/20'
            : 'bg-surface-input border-border-default hover:border-border-hover'
        }`}
      >
        {multiple && selected.length > 0 && (
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.map((val) => {
              const opt = options.find((o) => o.value === val)
              return (
                <span key={val} className={`inline-flex items-center gap-1 ${cfg.tag} rounded-md bg-primary-10 text-primary border border-primary/15`}>
                  <span className="truncate max-w-[120px]">{opt?.label ?? val}</span>
                  <button onClick={(ev) => { ev.stopPropagation(); onChange(selected.filter((v) => v !== val)) }}
                    className="p-0.5 rounded hover:bg-primary-20" aria-label={`Remove ${opt?.label ?? val}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
        {!multiple && <span className={`flex-1 truncate ${displayLabel ? 'text-text-primary' : 'text-text-quaternary'}`}>{displayLabel ?? placeholder}</span>}
        {multiple && selected.length === 0 && <span className="flex-1 text-text-quaternary truncate">{placeholder}</span>}
        <div className="flex items-center gap-1 flex-shrink-0">
          {clearable && selected.length > 0 && !disabled && (
            <button onClick={(e) => { e.stopPropagation(); onChange(multiple ? [] : '') }}
              className="p-0.5 rounded hover:bg-bg-hover text-text-quaternary hover:text-text-secondary" aria-label="Clear">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-text-quaternary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <m.div ref={listRef}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.15 }}
              style={{ position: 'fixed', left: pos.x, top: pos.y, width: pos.w, zIndex: 9999 }}
              className="bg-bg-elevated border border-border-hover rounded-xl shadow-dropdown overflow-hidden">
              {searchable && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
                  <Search className="w-4 h-4 text-text-quaternary flex-shrink-0" />
                  <input ref={searchRef} type="text" value={search}
                    onChange={(e) => { setSearch(e.target.value); setActiveIdx(0) }} onKeyDown={handleKey}
                    placeholder="Search..." className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-quaternary outline-none" aria-label="Search options" />
                </div>
              )}
              <div id={listboxId} role="listbox" aria-multiselectable={multiple} className="max-h-60 overflow-y-auto py-1 scrollbar-hide">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-text-tertiary">
                    <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-6 text-center text-sm text-text-tertiary">{emptyMessage}</div>
                ) : (
                  Array.from(grouped.entries()).map(([group, opts]) => (
                    <div key={group}>
                      {group && <div className="px-3 py-1.5 text-xs font-medium text-text-quaternary uppercase tracking-wider">{group}</div>}
                      {opts.map((opt) => {
                        const idx = flat.indexOf(opt)
                        const sel = selected.includes(opt.value)
                        return (
                          <div key={opt.value} ref={(el) => { if (idx >= 0) optRefs.current[idx] = el }}
                            role="option" aria-selected={sel} aria-disabled={opt.disabled}
                            onClick={() => !opt.disabled && selectOpt(opt.value)}
                            onMouseEnter={() => !opt.disabled && setActiveIdx(idx)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm transition-colors ${
                              opt.disabled ? 'opacity-40 cursor-not-allowed' : idx === activeIdx ? 'bg-bg-hover' : ''
                            } ${sel && !opt.disabled ? 'text-primary' : 'text-text-primary'}`}>
                            {opt.icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{opt.icon}</span>}
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{opt.label}</div>
                              {opt.description && <div className="text-xs text-text-tertiary truncate mt-0.5">{opt.description}</div>}
                            </div>
                            {sel && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
