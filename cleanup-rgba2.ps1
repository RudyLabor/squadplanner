$srcDir = "c:\Users\RudyL\Documents\Squadplannerlast\src"

# Additional replacements for edge-case opacity values in className strings
$replacements = @(
    # White rgba - non-standard opacities (className only)
    @('bg-\[rgba\(255,255,255,0\.02\)\]', 'bg-surface-card'),
    @('bg-\[rgba\(255,255,255,0\.01\)\]', 'bg-surface-card'),
    @('hover:bg-\[rgba\(255,255,255,0\.02\)\]', 'hover:bg-surface-card'),
    @('hover:bg-\[rgba\(255,255,255,0\.3\)\]', 'hover:bg-overlay-heavy'),
    @('border-\[rgba\(255,255,255,0\.03\)\]', 'border-border-subtle'),
    @('border-\[rgba\(255,255,255,0\.2\)\]', 'border-border-hover'),
    @('border-\[rgba\(255,255,255,0\.15\)\]', 'border-overlay-medium'),
    @('hover:border-\[rgba\(255,255,255,0\.15\)\]', 'hover:border-border-hover'),
    @('text-\[rgba\(255,255,255,0\.35\)\]', 'text-text-tertiary'),

    # Accent primary (indigo 99,102,241) - gradient and edge cases (className)
    @('from-\[rgba\(99,102,241,0\.05\)\]', 'from-primary-5'),
    @('from-\[rgba\(99,102,241,0\.08\)\]', 'from-primary-10'),
    @('from-\[rgba\(99,102,241,0\.1\)\]', 'from-primary-10'),
    @('from-\[rgba\(99,102,241,0\.12\)\]', 'from-primary-15'),
    @('to-\[rgba\(99,102,241,0\.05\)\]', 'to-primary-5'),
    @('bg-\[rgba\(99,102,241,0\.04\)\]', 'bg-primary-5'),
    @('bg-\[rgba\(99,102,241,0\.075\)\]', 'bg-primary-10'),
    @('border-\[rgba\(99,102,241,0\.1\)\]', 'border-primary'),

    # Accent success (green 52,211,153) - gradient and edge cases
    @('from-\[rgba\(52,211,153,0\.05\)\]', 'from-success-5'),
    @('from-\[rgba\(52,211,153,0\.06\)\]', 'from-success-5'),
    @('to-\[rgba\(52,211,153,0\.05\)\]', 'to-success-5'),
    @('to-\[rgba\(52,211,153,0\.02\)\]', 'to-transparent'),
    @('border-\[rgba\(52,211,153,0\.1\)\]', 'border-success'),
    @('border-\[rgba\(52,211,153,0\.12\)\]', 'border-success'),
    @('border-\[rgba\(52,211,153,0\.15\)\]', 'border-success'),
    @('bg-\[rgba\(52,211,153,0\.075\)\]', 'bg-success-10'),

    # Accent warning (yellow 251,191,36) - gradient and edge cases
    @('from-\[rgba\(251,191,36,0\.06\)\]', 'from-warning-5'),
    @('from-\[rgba\(251,191,36,0\.08\)\]', 'from-warning-10'),
    @('from-\[rgba\(251,191,36,0\.1\)\]', 'from-warning-10'),
    @('to-\[rgba\(251,191,36,0\.02\)\]', 'to-transparent'),
    @('to-\[rgba\(251,191,36,0\.05\)\]', 'to-warning-5'),
    @('border-\[rgba\(251,191,36,0\.1\)\]', 'border-warning'),
    @('border-\[rgba\(251,191,36,0\.12\)\]', 'border-warning'),
    @('border-\[rgba\(251,191,36,0\.15\)\]', 'border-warning'),
    @('bg-\[rgba\(251,191,36,0\.025\)\]', 'bg-warning-5'),
    @('bg-\[rgba\(251,191,36,0\.075\)\]', 'bg-warning-10'),
    @('bg-\[rgba\(251,191,36,0\.12\)\]', 'bg-warning-10'),
    @('bg-\[rgba\(251,191,36,0\.2\)\]', 'bg-warning-15'),

    # Accent purple (167,139,250) - gradient and edge cases
    @('from-\[rgba\(167,139,250,0\.06\)\]', 'from-purple-10'),
    @('to-\[rgba\(167,139,250,0\.02\)\]', 'to-transparent'),
    @('to-\[rgba\(167,139,250,0\.08\)\]', 'to-purple-10'),
    @('border-\[rgba\(167,139,250,0\.1\)\]', 'border-purple'),
    @('border-\[rgba\(167,139,250,0\.12\)\]', 'border-purple'),
    @('bg-\[rgba\(167,139,250,0\.12\)\]', 'bg-purple-10'),
    @('bg-\[rgba\(167,139,250,0\.08\)\]', 'bg-purple-10'),
    @('bg-\[rgba\(167,139,250,0\.025\)\]', 'bg-purple-10'),
    @('bg-\[rgba\(167,139,250,0\.075\)\]', 'bg-purple-10'),

    # Accent pink/error variant (251,113,133) - gradient and edge cases
    @('from-\[rgba\(251,113,133,0\.06\)\]', 'from-error-5'),
    @('to-\[rgba\(251,113,133,0\.02\)\]', 'to-transparent'),
    @('border-\[rgba\(251,113,133,0\.12\)\]', 'border-error'),
    @('bg-\[rgba\(251,113,133,0\.12\)\]', 'bg-error-10'),
    @('bg-\[rgba\(251,113,133,0\.15\)\]', 'bg-error-15'),

    # Accent 74,222,128 (green variant) - className patterns
    @('bg-\[rgba\(74,222,128,0\.15\)\]', 'bg-success-15'),
    @('border-\[rgba\(74,222,128,0\.3\)\]', 'border-success'),
    @('to-\[rgba\(74,222,128,0\.05\)\]', 'to-success-5'),
    @('to-\[rgba\(74,222,128,0\.08\)\]', 'to-success-10'),
    @('hover:to-\[rgba\(74,222,128,0\.08\)\]', 'hover:to-success-10'),
    @('from-\[rgba\(94,109,210,0\.08\)\]', 'from-primary-10'),
    @('hover:from-\[rgba\(94,109,210,0\.12\)\]', 'hover:from-primary-15'),

    # Shadow patterns with non-standard colors
    @('shadow-\[0_0_40px_rgba\(249,115,22,0\.5\)\]', 'shadow-glow-warning'),
    @('hover:shadow-\[0_0_20px_rgba\(94,109,210,0\.2\)\]', 'hover:shadow-glow-primary-md'),

    # Sessions page text color edge case
    @('text-\[rgba\(255,255,255,0\.35\)\]', 'text-text-tertiary'),

    # Focus border edge cases
    @('focus:border-\[rgba\(94,109,210,0\.5\)\]', 'focus:border-primary')
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
