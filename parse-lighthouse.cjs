const r = JSON.parse(require('fs').readFileSync('c:/Users/RudyL/Documents/Squadplannerlast/audit-screenshots/lighthouse-landing.json', 'utf8'));
const a = r.audits;
const refs = r.categories.accessibility.auditRefs.map(x => x.id);
refs.forEach(k => {
  if (a[k] && a[k].score !== null && a[k].score < 1) {
    console.log(k, ':', a[k].score, '--', a[k].title);
    if (a[k].details && a[k].details.items) {
      a[k].details.items.slice(0, 3).forEach(i => {
        const snippet = (i.node && i.node.snippet) || '';
        console.log('  snippet:', snippet.substring(0, 150));
      });
    }
  }
});

// Also check perf audit failures
console.log('\n--- Performance audit failures ---');
const perfRefs = r.categories.performance.auditRefs.map(x => x.id);
perfRefs.forEach(k => {
  if (a[k] && a[k].score !== null && a[k].score < 0.9) {
    console.log(k, ':', a[k].score, '--', a[k].title, '--', a[k].displayValue || '');
  }
});
