#!/usr/bin/env node

// Bundle analysis script - Find the biggest performance killers
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

console.log('🔍 ANALYZING SQUADPLANNER BUNDLE BLOAT...\n')

// 1. Current bundle sizes
const buildFiles = glob.sync('build/client/assets/*.js').map(file => {
  const stats = require('fs').statSync(file)
  const name = file.split('/').pop()
  const sizeKB = (stats.size / 1024).toFixed(1)
  return { name, sizeKB: parseFloat(sizeKB), path: file }
}).sort((a, b) => b.sizeKB - a.sizeKB)

console.log('📦 BIGGEST BUNDLE CHUNKS:')
console.log('=' .repeat(60))
buildFiles.slice(0, 10).forEach(file => {
  const status = file.sizeKB > 200 ? '🔴 CRITICAL' : 
                 file.sizeKB > 100 ? '🟡 WARNING' : '✅ OK'
  console.log(`${status} ${file.sizeKB.toString().padStart(6)} KB - ${file.name}`)
})

const totalSizeKB = buildFiles.reduce((sum, file) => sum + file.sizeKB, 0)
console.log(`\n📊 TOTAL BUNDLE: ${totalSizeKB.toFixed(1)} KB`)
console.log(`🎯 TARGET: 200 KB (${((totalSizeKB - 200) / totalSizeKB * 100).toFixed(1)}% reduction needed)`)

// 2. Dependency analysis
console.log('\n🔍 ANALYZING DEPENDENCIES...')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const dependencies = Object.keys(packageJson.dependencies || {})
const devDependencies = Object.keys(packageJson.devDependencies || {})

// Known heavy dependencies that could be optimized
const heavyDeps = [
  { name: '@livekit/components-react', impact: '~450KB', optimization: 'Custom minimal implementation' },
  { name: 'framer-motion', impact: '~150KB', optimization: 'Lazy load, tree shake' },
  { name: '@supabase/supabase-js', impact: '~170KB', optimization: 'Minimal imports only' },
  { name: 'recharts', impact: '~100KB', optimization: 'Lazy load charts' },
  { name: 'date-fns', impact: '~60KB', optimization: 'Switch to day.js' }
]

console.log('\n🎯 OPTIMIZATION OPPORTUNITIES:')
console.log('=' .repeat(60))
heavyDeps.forEach(dep => {
  const isUsed = dependencies.includes(dep.name) || devDependencies.includes(dep.name)
  if (isUsed) {
    console.log(`🔴 ${dep.name}`)
    console.log(`   Impact: ${dep.impact}`)
    console.log(`   Fix: ${dep.optimization}\n`)
  }
})

// 3. Generate optimization checklist
const optimizations = [
  '[ ] Replace @livekit/components-react with minimal custom implementation (-450KB)',
  '[ ] Implement lazy loading for framer-motion animations (-100KB)', 
  '[ ] Use minimal Supabase imports, not full client (-80KB)',
  '[ ] Lazy load Charts/Recharts components (-100KB)',
  '[ ] Switch from date-fns to day.js (-40KB)',
  '[ ] Remove unused CSS via PurgeCSS (-50KB)',
  '[ ] Optimize images with WebP/AVIF (-30KB)',
  '[ ] Tree shake lodash utilities (-20KB)'
]

console.log('📋 OPTIMIZATION CHECKLIST:')
console.log('=' .repeat(60))
optimizations.forEach(item => console.log(item))

// 4. Performance budget
const performanceBudget = {
  'Initial Bundle': { current: `${totalSizeKB}KB`, target: '200KB', status: totalSizeKB <= 200 ? '✅' : '🔴' },
  'Route Chunks': { current: 'Unknown', target: '<50KB each', status: '🟡' },
  'Vendor Chunks': { current: `${buildFiles.filter(f => f.name.includes('vendor')).reduce((sum, f) => sum + f.sizeKB, 0)}KB`, target: '<100KB', status: '🔴' }
}

console.log('\n📊 PERFORMANCE BUDGET:')
console.log('=' .repeat(60))
Object.entries(performanceBudget).forEach(([metric, data]) => {
  console.log(`${data.status} ${metric}: ${data.current} (target: ${data.target})`)
})

// 5. Next steps
console.log('\n🚀 IMMEDIATE ACTIONS (THIS WEEK):')
console.log('=' .repeat(60))
console.log('1. Implement route-based code splitting (expected -400KB)')
console.log('2. Replace LiveKit with minimal implementation (expected -300KB)')  
console.log('3. Lazy load heavy components (expected -200KB)')
console.log('4. Run bundle analyzer for visual analysis')
console.log('5. Set up performance monitoring')

console.log('\n💡 Run: npm run build:analyze to see visual bundle breakdown')