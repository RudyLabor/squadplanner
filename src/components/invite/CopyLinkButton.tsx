import { Check, Copy } from '../icons'
interface CopyLinkButtonProps {
  linkCopied: boolean
  onCopy: () => void
}

export function CopyLinkButton({ linkCopied, onCopy }: CopyLinkButtonProps) {
  return (
    <div className="p-4 border-b border-border-subtle">
      <button
        onClick={onCopy}
        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-interactive ${
          linkCopied
            ? 'bg-success-15 text-success border border-success/20'
            : 'bg-overlay-subtle text-text-secondary hover:bg-overlay-light hover:text-text-primary border border-border-subtle'
        }`}
        aria-label={linkCopied ? "Lien d'invitation copié" : "Copier le lien d'invitation"}
      >
        {linkCopied ? (
          <>
            <Check className="w-4 h-4" />
            Lien copié !
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copier le lien d'invitation
          </>
        )}
      </button>
    </div>
  )
}
