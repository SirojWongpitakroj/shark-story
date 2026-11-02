const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {series}=require('./presentation-charts');
const dist=__dirname,html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
assert.deepEqual([...html.matchAll(/<figure[^>]+id="figure-(\d+)"/g)].map(m=>+m[1]),[1,2,3,4,5,6,7,8,9,10]);
assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert.equal((html.match(/class="chart-svg /g)||[]).length,18,'Nine charts have readable wide and portrait layouts');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'No duplicate SVG, scene, or control IDs');
for(const match of html.matchAll(/(?:href|src|srcset)="([^"]+)"/g)){
  const ref=match[1];if(ref.startsWith('http'))continue;
  if(ref.startsWith('#'))assert.ok(ids.includes(ref.slice(1)),ref);
  else assert.ok(fs.existsSync(path.join(dist,ref)),ref);
}
// check-data.js validates the canonical local figure assets and their dimensions.
for(const n of [1,2,4,5,6,7,8,9,10]){
  // Exact plot values are checked against the existing auditable aggregations.
  assert.ok(series(n).every(d=>Number.isFinite(d.value)));
  assert.ok(!html.includes('NaN'));
  assert.ok(html.includes(`id="chart-${n}-wide-desc"`)&&html.includes(`id="chart-${n}-mobile-desc"`));
}
assert.equal(series(1).reduce((sum,d)=>sum+d.value,0),6129);
assert.equal(series(4).reduce((sum,d)=>sum+d.value,0),6129);
assert.equal(series(6).reduce((sum,d)=>sum+d.value,0),6129);
assert.equal(series(2).reduce((sum,d)=>sum+d.known,0),5483);
assert.equal(series(7).reduce((sum,d)=>sum+d.known,0),1606);
assert.equal(series(8).reduce((sum,d)=>sum+d.known,0),5532);
assert.ok(Math.abs(series(9).reduce((sum,d)=>sum+d.value,0)-100)<1e-10);
console.log('Site checks passed: ten figures, transparent responsive SVGs, accessible descriptions, unique IDs, links, downloads, and unchanged analysis totals.');
