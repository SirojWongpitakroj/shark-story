const fs=require('fs'),path=require('path'),assert=require('assert'),core=require('./map-core');
const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'data/country_year_counts.json'),'utf8'));
const all=core.aggregate(rows),audit=JSON.parse(fs.readFileSync(path.join(__dirname,'data/cleaning_audit.json'),'utf8'));
assert.equal(all.total,audit.cleanedRows);
assert.equal(all.counts.get('United States'),2205);assert.equal(all.counts.get('Australia'),1318);assert.equal(all.counts.get('South Africa'),571);
for(const year of [1800,1900,1950]){const result=core.aggregate(rows,year);assert.equal(result.total,rows.filter(d=>d[0]>=year).reduce((sum,d)=>sum+d[2],0));assert.equal([...result.counts.values()].reduce((sum,n)=>sum+n,0),result.total);}
const ranges=core.timeRanges(rows),periods=ranges.slice(1),recombined=new Map();
assert.equal(ranges[0].start,Math.min(...rows.map(r=>r[0])));
assert.equal(ranges[0].end,Math.max(...rows.map(r=>r[0])));
for(const [i,range]of periods.entries()){
  if(i)assert.equal(range.start,periods[i-1].end+1,'No overlapping or missing years');
  const result=core.aggregate(rows,range.start,range.end);
  assert.equal(result.total,rows.filter(r=>r[0]>=range.start&&r[0]<=range.end).reduce((sum,r)=>sum+r[2],0));
  for(const [name,count]of result.counts)recombined.set(name,(recombined.get(name)||0)+count);
}
assert.deepEqual([...recombined].sort(),[...all.counts].sort(),'Every country total reconciles across periods');
for(const year of [1849,1850,1899,1900,1949,1950,1999,2000,2018])assert.equal(core.aggregate(rows,year,year).total,rows.filter(r=>r[0]===year).reduce((sum,r)=>sum+r[2],0),'Inclusive boundary year');
assert.equal(core.aggregate(rows,2019,2020).total,0,'Empty periods stay empty');
assert.equal(core.canonical('United States of America'),'United States');assert.equal(core.canonical('United Arab Emirates (Uae)'),'United Arab Emirates');assert.equal(core.canonical('Pacific Ocean'),'Pacific Ocean');assert.equal(core.canonical('New Guinea'),'New Guinea');
const matching=core.coverage([{name:'United States'},{name:'Australia'}],all.counts);assert.equal(matching.matched,2205+1318);assert.equal(matching.matched+matching.unmatched.reduce((sum,d)=>sum+d[1],0),all.total);
assert.notEqual(core.color(0),core.color(1));assert.equal(core.color(499),core.bins[2].color);assert.equal(core.color(500),core.bins[3].color);
// Synthetic geometry is a decoder unit test only; never shipped as map data.
const fixture={type:'Topology',transform:{scale:[.1,.1],translate:[10,20]},arcs:[[[0,0],[10,0]],[[10,10],[0,-10]],[[10,10],[-10,-10]]],objects:{countries:{geometries:[{id:'test',type:'Polygon',properties:{name:'Test'},arcs:[[0,-2,2]]}]}}};
const decoded=core.decode(fixture);assert.deepEqual(decoded[0].polygons[0][0],[[10,20],[11,20],[11,21],[10,20]]);assert.ok(core.path(decoded[0]).startsWith('M'));assert.ok(!core.path(decoded[0]).includes('NaN'));
assert.deepEqual(core.project(0,0),[500,270]);
assert.ok(Math.abs(core.project(90,0)[0]+core.project(-90,0)[0]-1000)<1e-8);
assert.ok(Math.abs(core.project(0,60)[1]+core.project(0,-60)[1]-540)<1e-8);
assert.ok(core.project(180,60)[0]<core.project(180,0)[0]);
for(let lon=-180;lon<=180;lon+=30)for(let lat=-90;lat<=90;lat+=15){const [x,y]=core.project(lon,lat);assert.ok(x>=0&&x<=1000&&y>=0&&y<=540);}
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');assert.ok(html.includes('id="figure-3"'));assert.ok(html.includes('src="country-map.js"'));assert.ok(html.includes('<em>increasing.</em>'));assert.ok(html.includes('id="country-records"'));
for(const range of ranges)assert.ok(html.includes(`data-start="${range.start}" data-end="${range.end}"`));
console.log('Map checks passed: country totals, period filters, aliases, unmapped coverage, legend thresholds, topology decoding, and page integration.');
