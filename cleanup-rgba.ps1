$srcDir = "c:\Users\RudyL\Documents\Squadplannerlast\src"

# Define all replacements
$replacements = @(
    # White rgba bg
    @('bg-\[rgba\(255,255,255,0\.03\)\]', 'bg-surface-card'),
    @('bg-\[rgba\(255,255,255,0\.04\)\]', 'bg-border-subtle'),
    @('bg-\[rgba\(255,255,255,0\.05\)\]', 'bg-border-subtle'),
    @('bg-\[rgba\(255,255,255,0\.06\)\]', 'bg-border-default'),
    @('bg-\[rgba\(255,255,255,0\.08\)\]', 'bg-overlay-light'),
    @('bg-\[rgba\(255,255,255,0\.1\)\]', 'bg-border-hover'),
    @('bg-\[rgba\(255,255,255,0\.12\)\]', 'bg-overlay-medium'),
    @('bg-\[rgba\(255,255,255,0\.15\)\]', 'bg-overlay-medium'),
    @('bg-\[rgba\(255,255,255,0\.2\)\]', 'bg-overlay-heavy'),
    # White rgba border
    @('border-\[rgba\(255,255,255,0\.04\)\]', 'border-border-subtle'),
    @('border-\[rgba\(255,255,255,0\.05\)\]', 'border-border-subtle'),
    @('border-\[rgba\(255,255,255,0\.06\)\]', 'border-border-default'),
    @('border-\[rgba\(255,255,255,0\.08\)\]', 'border-border-hover'),
    @('border-\[rgba\(255,255,255,0\.1\)\]', 'border-border-hover'),
    @('border-\[rgba\(255,255,255,0\.12\)\]', 'border-border-hover'),
    # White rgba hover
    @('hover:bg-\[rgba\(255,255,255,0\.05\)\]', 'hover:bg-border-subtle'),
    @('hover:bg-\[rgba\(255,255,255,0\.06\)\]', 'hover:bg-border-default'),
    @('hover:bg-\[rgba\(255,255,255,0\.08\)\]', 'hover:bg-overlay-light'),
    @('hover:bg-\[rgba\(255,255,255,0\.1\)\]', 'hover:bg-border-hover'),
    @('hover:bg-\[rgba\(255,255,255,0\.12\)\]', 'hover:bg-overlay-medium'),
    @('hover:border-\[rgba\(255,255,255,0\.1\)\]', 'hover:border-border-hover'),
    # Focus border
    @('focus:border-\[rgba\(99,102,241,0\.5\)\]', 'focus:border-primary'),
    @('focus:border-\[rgba\(99,102,241,0\.4\)\]', 'focus:border-primary'),
    # Accent rgba bg - primary (indigo)
    @('bg-\[rgba\(99,102,241,0\.05\)\]', 'bg-primary-5'),
    @('bg-\[rgba\(99,102,241,0\.08\)\]', 'bg-primary-10'),
    @('bg-\[rgba\(99,102,241,0\.1\)\]', 'bg-primary-10'),
    @('bg-\[rgba\(99,102,241,0\.12\)\]', 'bg-primary-15'),
    @('bg-\[rgba\(99,102,241,0\.15\)\]', 'bg-primary-15'),
    @('bg-\[rgba\(99,102,241,0\.2\)\]', 'bg-primary-20'),
    @('bg-\[rgba\(99,102,241,0\.25\)\]', 'bg-primary-20'),
    # Accent rgba bg - success (green)
    @('bg-\[rgba\(52,211,153,0\.05\)\]', 'bg-success-5'),
    @('bg-\[rgba\(52,211,153,0\.08\)\]', 'bg-success-10'),
    @('bg-\[rgba\(52,211,153,0\.1\)\]', 'bg-success-10'),
    @('bg-\[rgba\(52,211,153,0\.12\)\]', 'bg-success-15'),
    @('bg-\[rgba\(52,211,153,0\.15\)\]', 'bg-success-15'),
    @('bg-\[rgba\(52,211,153,0\.2\)\]', 'bg-success-20'),
    # Accent rgba bg - error (red)
    @('bg-\[rgba\(248,113,113,0\.05\)\]', 'bg-error-5'),
    @('bg-\[rgba\(248,113,113,0\.1\)\]', 'bg-error-10'),
    @('bg-\[rgba\(248,113,113,0\.15\)\]', 'bg-error-15'),
    # Accent rgba bg - warning (yellow)
    @('bg-\[rgba\(251,191,36,0\.05\)\]', 'bg-warning-5'),
    @('bg-\[rgba\(251,191,36,0\.08\)\]', 'bg-warning-10'),
    @('bg-\[rgba\(251,191,36,0\.1\)\]', 'bg-warning-10'),
    @('bg-\[rgba\(251,191,36,0\.15\)\]', 'bg-warning-15'),
    # Accent rgba bg - info (sky blue)
    @('bg-\[rgba\(56,189,248,0\.1\)\]', 'bg-info-10'),
    # Accent rgba bg - purple
    @('bg-\[rgba\(167,139,250,0\.1\)\]', 'bg-purple-10'),
    @('bg-\[rgba\(167,139,250,0\.15\)\]', 'bg-purple-15'),
    # Accent rgba bg - pink (error variant for validation)
    @('bg-\[rgba\(251,113,133,0\.05\)\]', 'bg-error-5'),
    @('bg-\[rgba\(251,113,133,0\.1\)\]', 'bg-error-10'),
    # Accent rgba border
    @('border-\[rgba\(99,102,241,0\.3\)\]', 'border-primary'),
    @('border-\[rgba\(99,102,241,0\.15\)\]', 'border-primary'),
    @('border-\[rgba\(99,102,241,0\.2\)\]', 'border-primary'),
    @('border-\[rgba\(99,102,241,0\.4\)\]', 'border-primary'),
    @('border-\[rgba\(52,211,153,0\.3\)\]', 'border-success'),
    @('border-\[rgba\(52,211,153,0\.2\)\]', 'border-success'),
    @('border-\[rgba\(248,113,113,0\.2\)\]', 'border-error'),
    @('border-\[rgba\(248,113,113,0\.3\)\]', 'border-error'),
    @('border-\[rgba\(251,113,133,0\.1\)\]', 'border-error'),
    @('border-\[rgba\(251,113,133,0\.2\)\]', 'border-error'),
    @('border-\[rgba\(251,191,36,0\.3\)\]', 'border-warning'),
    @('border-\[rgba\(251,191,36,0\.2\)\]', 'border-warning'),
    # Gradient
    @('from-\[rgba\(99,102,241,0\.15\)\]', 'from-primary-15'),
    @('to-\[rgba\(167,139,250,0\.15\)\]', 'to-purple-15'),
    # Hover accent
    @('hover:bg-\[rgba\(99,102,241,0\.15\)\]', 'hover:bg-primary-15'),
    @('hover:bg-\[rgba\(99,102,241,0\.25\)\]', 'hover:bg-primary-20'),
    @('hover:bg-\[rgba\(99,102,241,0\.12\)\]', 'hover:bg-primary-15'),
    @('hover:bg-\[rgba\(99,102,241,0\.1\)\]', 'hover:bg-primary-10'),
    @('hover:bg-\[rgba\(52,211,153,0\.12\)\]', 'hover:bg-success-15'),
    @('hover:bg-\[rgba\(52,211,153,0\.1\)\]', 'hover:bg-success-10'),
    @('hover:bg-\[rgba\(248,113,113,0\.1\)\]', 'hover:bg-error-10'),
    @('hover:bg-\[rgba\(239,68,68,0\.1\)\]', 'hover:bg-error-10'),
    # Focus ring
    @('focus:ring-\[rgba\(99,102,241,0\.15\)\]', 'focus:ring-primary/15'),
    @('focus:ring-\[rgba\(99,102,241,0\.2\)\]', 'focus:ring-primary/20'),
    # Ring
    @('ring-\[rgba\(99,102,241,0\.4\)\]', 'ring-primary'),
    @('ring-\[rgba\(99,102,241,0\.3\)\]', 'ring-primary'),
    # Scrollbar
    @('scrollbar-thumb-\[rgba\(255,255,255,0\.1\)\]', 'scrollbar-thumb-border-hover'),
    # Shadow glow patterns - indigo/primary
    @('shadow-\[0_0_(\d+)px_rgba\(99,102,241,[^\]]+\)\]', 'shadow-glow-primary-sm'),
    # Shadow glow patterns - green/success
    @('shadow-\[0_0_(\d+)px_rgba\(52,211,153,[^\]]+\)\]', 'shadow-glow-success'),
    @('shadow-\[0_0_(\d+)px_rgba\(74,222,128,[^\]]+\)\]', 'shadow-glow-success'),
    # Shadow glow patterns - red/error
    @('shadow-\[0_0_(\d+)px_rgba\(248,113,113,[^\]]+\)\]', 'shadow-glow-error'),
    # Shadow glow patterns - yellow/warning
    @('shadow-\[0_0_(\d+)px_rgba\(251,191,36,[^\]]+\)\]', 'shadow-glow-warning'),
    # Focus shadow
    @('focus:shadow-\[0_0_[^\]]+\]', 'focus:shadow-glow-primary-md'),
    # Other shadow patterns
    @('shadow-\[rgba\(52,211,153,0\.15\)\]', 'shadow-glow-success'),
    @('shadow-lg shadow-\[rgba\(52,211,153,0\.15\)\]', 'shadow-lg shadow-glow-success')
)

$files = Get-ChildItem -Path $srcDir -Recurse -Filter "*.tsx"
$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($null -eq $content) { continue }

    $original = $content

    foreach ($pair in $replacements) {
        $pattern = $pair[0]
        $replacement = $pair[1]
        $content = $content -replace $pattern, $replacement
    }

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalChanges++
        Write-Host "Modified: $($file.Name)"
    }
}

Write-Host "`nTotal files modified: $totalChanges"
