const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=__dirname,fig=path.join(root,'figures'),derived=path.join(root,'data');
function parseCsv(s){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(quoted){if(c==='"'&&s[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(field);field='';}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}else field+=c;}if(field||row.length){row.push(field);rows.push(row);}const headers=rows.shift();return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));}
const read=name=>parseCsv(fs.readFileSync(path.join(derived,name),'utf8'));
const cleaned=read('incidents_cleaned.csv'),audit=JSON.parse(fs.readFileSync(path.join(derived,'cleaning_audit.json'),'utf8'));
const sum=(xs,key)=>xs.reduce((n,d)=>n+Number(d[key]),0);
assert.equal(cleaned.length,audit.cleanedRows);
assert.equal(cleaned.length+Object.values(audit.exclusions).reduce((a,b)=>a+b,0),audit.sourceRows);
assert.ok(cleaned.every(d=>Number.isInteger(+d.year)&&+d.year>=1800&&+d.year<=new Date().getFullYear()));
assert.equal(cleaned.filter(d=>d.fatal_outcome==='Fatal').length,audit.fatalOutcomes.fatal);
assert.equal(cleaned.filter(d=>d.fatal_outcome==='Non-fatal').length,audit.fatalOutcomes.nonfatal);
assert.equal(cleaned.filter(d=>d.fatal_outcome==='Unknown').length,audit.fatalOutcomes.unknown);
const activity=read('activity_counts.csv'),species=read('species_counts.csv'),countries=read('country_counts.csv'),years=read('yearly_incident_counts.csv');
for(const rows of [activity,species,countries,years])assert.equal(sum(rows,'recorded_incidents'),cleaned.length);
assert.equal(new Set(activity.map(d=>d.activity)).size,activity.length);
assert.equal(new Set(species.map(d=>d.species)).size,species.length);
for(const file of ['decade_fatality_rates.csv','activity_fatality_rates.csv','species_fatality_rates.csv']){
  for(const d of read(file)){
    const fatal=+d.fatal,nonfatal=+d.nonfatal,unknown=+d.unknown,known=+d.known,total=+(d.total_incidents??d.recorded_incidents);
    assert.equal(fatal+nonfatal,known);
    assert.equal(known+unknown,total);
    assert.ok(Math.abs(+d.rate-100*fatal/known)<1e-9);
    if(file==='decade_fatality_rates.csv')assert.equal(d.eligible==='true',known>=20);
    else assert.equal(d.eligible==='true',known>=30);
  }
}
const missing=read('missing_data_summary.csv');
const age=missing.filter(d=>d.section==='overall_age');
assert.equal(age.length,2);
assert.equal(sum(age,'available')+sum(age,'missing'),cleaned.length);
assert.ok(Math.abs(sum(age,'percentage')-100)<1e-9);
const types=missing.filter(d=>d.section==='age_by_type');
assert.equal(sum(types,'total'),cleaned.length);
for(const d of types){assert.equal(+d.available + +d.missing,+d.total);assert.ok(Math.abs(+d.percentage-100*+d.missing/+d.total)<1e-9);assert.equal(d.eligible==='true',+d.total>=30);}
const pngs=fs.readdirSync(fig).filter(n=>n.endsWith('.png'));
const svgs=fs.readdirSync(fig).filter(n=>n.endsWith('.svg'));
assert.equal(pngs.length,10);assert.equal(svgs.length,10);
const manifest=fs.readFileSync(path.join(derived,'figure_manifest.md'),'utf8');
for(let i=1;i<=10;i++){
  const prefix=`fig${String(i).padStart(2,'0')}_`;
  const png=pngs.find(n=>n.startsWith(prefix)),svg=svgs.find(n=>n.startsWith(prefix));
  assert.ok(png&&svg&&png.slice(0,-4)===svg.slice(0,-4));
  const buf=fs.readFileSync(path.join(fig,png));
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(buf.readUInt32BE(16),1600);assert.equal(buf.readUInt32BE(20),900);
  const markup=fs.readFileSync(path.join(fig,svg),'utf8');
  assert.ok(markup.includes('width="1600" height="900"'));
  assert.ok(markup.includes('Source: Global Shark Attacks dataset, Kaggle.'));
  assert.ok(manifest.includes(`### Figure ${i}`)&&manifest.includes(png)&&manifest.includes(svg));
}
console.log(`Validated ${cleaned.length.toLocaleString()} cleaned records, derived metrics, 10 PNGs, 10 SVGs, and manifest.`);
