const fs = require('fs');
const raw = fs.readFileSync('playwright-results.json', 'utf8');
// Find the line that starts with { to skip dotenv output
const lines = raw.split('\n');
let jsonStr = '';
let found = false;
for (const line of lines) {
  if (!found && line.trim().startsWith('{')) found = true;
  if (found) jsonStr += line + '\n';
}
const json = JSON.parse(jsonStr);

function extractSpecs(suites) {
  let specs = [];
  for (const suite of suites) {
    if (suite.specs) specs.push(...suite.specs);
    if (suite.suites) specs.push(...extractSpecs(suite.suites));
  }
  return specs;
}

const allSpecs = extractSpecs(json.suites);
const skipped = allSpecs.filter(s => s.ok && s.tests.some(t => t.status === 'skipped'));
const failed = allSpecs.filter(s => s.ok === false);
const flaky = allSpecs.filter(s => s.ok && s.tests.some(t => t.status === 'flaky'));

console.log('=== SKIPPED (' + skipped.length + ') ===');
skipped.forEach((s, i) => {
  let reason = 'no reason';
  try {
    const ann = s.tests[0].results[0].annotations.find(a => a.type === 'skip');
    if (ann) reason = ann.description;
  } catch {}
  console.log((i + 1) + '. [' + s.file + '] ' + s.title + ' => ' + reason);
});

console.log('\n=== FAILED (' + failed.length + ') ===');
failed.forEach(s => console.log('[' + s.file + '] ' + s.title));

console.log('\n=== FLAKY (' + flaky.length + ') ===');
flaky.forEach(s => console.log('[' + s.file + '] ' + s.title));
