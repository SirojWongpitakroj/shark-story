// Presentation only: read the existing aggregations without changing the analysis.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function parseCsv(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { value += '"'; i++; } else if (c === '"') quoted = false; else value += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(value); value = ''; }
    else if (c === '\n') { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift();
  return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}
const read = name => parseCsv(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const stems = ['attacks_over_time','fatality_rate_over_time','attacks_by_country','incidents_by_activity','fatality_by_activity','incidents_by_species','fatality_by_species','known_vs_unknown_species','age_data_completeness','missing_age_by_incident_type'];
const titles = ['Recorded shark attacks over time','Fatality rate by decade','Recorded encounters around the world','What were people doing?','Fatality rate by activity','Which sharks appear in the record?','Fatality rate by identified species','When the shark is unidentified','How much age information is missing?','Missing age, by incident type'];
const captions = ['Annual recorded incidents, 1800–2018','Known outcomes; decades with at least 20 outcomes','Country counts, including unmapped locations','Recorded incidents by activity','Known outcomes; groups with at least 30 outcomes','Recorded incidents by species category','Identified species; at least 30 known outcomes','Known outcomes by species identification','Usable versus missing or unusable age','Incident types with at least 30 records'];
const stem = n => `fig${String(n).padStart(2, '0')}_${stems[n - 1]}`;
const format = n => Number(n).toLocaleString('en-US');
const percent = n => Number(n).toFixed(1) + '%';
const colors = { blue: '#58b6c9', red: '#e58f78', gray: '#8da4af' };
function series(n) {
  if (n === 1) return read('yearly_incident_counts.csv').map(r => ({ x: +r.year, value: +r.recorded_incidents }));
  if (n === 2) return read('decade_fatality_rates.csv').filter(r => r.eligible === 'true').map(r => ({ x: +r.decade, value: +r.rate, known: +r.known }));
  if (n === 4 || n === 5 || n === 6 || n === 7) {
    const activity = n < 6, rate = n === 5 || n === 7;
    return read(`${activity ? 'activity' : 'species'}_${rate ? 'fatality_rates' : 'counts'}.csv`)
      .filter(r => (!rate || r.eligible === 'true') && (n !== 7 || r.species !== 'Unknown Species'))
      .map(r => ({ label: r[activity ? 'activity' : 'species'], value: +(rate ? r.rate : r.recorded_incidents), known: +r.known }))
      .sort((a, b) => b.value - a.value);
  }
  if (n === 8) {
    const rows = read('species_fatality_rates.csv');
    return [false, true].map(unknown => {
      const selected = rows.filter(r => (r.species === 'Unknown Species') === unknown);
      const fatal = selected.reduce((s, r) => s + +r.fatal, 0), known = selected.reduce((s, r) => s + +r.known, 0);
      return { label: unknown ? 'Unknown species' : 'Identified species', value: 100 * fatal / known, known };
    });
  }
  if (n === 9) return read('missing_data_summary.csv').filter(r => r.section === 'overall_age').map(r => ({ label: r.category === 'Age Available' ? 'Age available' : 'Missing / unusable', value: +r.percentage, count: +(r.available || 0) + +(r.missing || 0) }));
  if (n === 10) return read('missing_data_summary.csv').filter(r => r.section === 'age_by_type' && r.eligible === 'true').map(r => ({ label: r.category, value: +r.percentage, known: +r.total }));
  return [];
}
function svg(n, mobile) {
  const data = series(n), rate = [2,5,7,8,9,10].includes(n), w = mobile ? 360 : 1200, h = mobile ? 520 : 640;
  const id = `chart-${n}-${mobile ? 'mobile' : 'wide'}`;
  const description = data.map(d => `${d.label || d.x}: ${rate ? percent(d.value) : format(d.value)}${d.known ? `; ${format(d.known)} known outcomes or records` : ''}`).join('. ');
  const out = [`<svg class="chart-svg chart-${mobile ? 'mobile' : 'wide'}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${escape(titles[n-1])}</title><desc id="${id}-desc">${escape(description)}</desc>`];
  const text = (x, y, value, cls = '', anchor = 'start') => out.push(`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${escape(value)}</text>`);
  const line = (x1, y1, x2, y2) => out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="chart-grid"/>`);
  const rect = (x,y,width,height,fill) => out.push(`<rect x="${x}" y="${y}" width="${Math.max(0,width)}" height="${height}" rx="2" fill="${fill}"/>`);
  const valueColor = d => /unknown/i.test(d.label) ? colors.gray : [5,7,8].includes(n) ? colors.red : colors.blue;
  if (n === 1 || n === 2) {
    const l = mobile ? 48 : 84, r = w - (mobile ? 14 : 26), t = 40, b = h - 66;
    const max = n === 2 ? 100 : Math.ceil(Math.max(...data.map(d => d.value))/20)*20;
    const x = v => l+(v-data[0].x)/(data.at(-1).x-data[0].x)*(r-l), y = v => b-v/max*(b-t);
    for(let i=0;i<=4;i++){const val=max*i/4;line(l,y(val),r,y(val));text(l-10,y(val)+5,rate?`${val}%`:format(val),'axis','end');}
    const ticks = mobile ? [data[0].x,1900,data.at(-1).x] : n === 1 ? [1800,1850,1900,1950,2000,2018] : [1840,1880,1920,1960,2000,2010];
    ticks.forEach((v,i)=>text(x(v),b+29,v,'axis',i===0?'start':i===ticks.length-1?'end':'middle'));
    text(l,t-20,rate?'Fatal outcomes (%)':'Recorded incidents','axis');
    out.push(`<polyline fill="none" stroke="${n===2?colors.red:colors.blue}" stroke-width="${mobile?2.5:4}" stroke-linejoin="round" stroke-linecap="round" points="${data.map(d=>`${x(d.x)},${y(d.value)}`).join(' ')}"/>`);
    if(n===2)data.forEach(d=>out.push(`<circle cx="${x(d.x)}" cy="${y(d.value)}" r="${mobile?3:5}" fill="${colors.red}"/>`));
    text((l+r)/2,h-8,n===2?'Decade':'Year','axis','middle');
  } else if (n === 8) {
    const l=mobile?48:100,r=w-20,t=58,b=h-75,max=40;
    for(let i=0;i<=4;i++){const y=b-i/4*(b-t);line(l,y,r,y);text(l-10,y+5,`${i*10}%`,'axis','end');}
    data.forEach((d,i)=>{const x=l+(r-l)*(i+.5)/2,bw=(r-l)*.27,barH=d.value/max*(b-t);rect(x-bw/2,b-barH,bw,barH,i?colors.gray:colors.blue);text(x,b-barH-16,percent(d.value),'value','middle');text(x,b+28,mobile?(i?'Unknown':'Identified'):d.label,'label','middle');text(x,b+53,`n = ${format(d.known)}`,'axis','middle');});
  } else if(n===9) {
    const l=mobile?16:60,barW=w-2*l,y=mobile?200:260,bh=mobile?90:130;
    let cursor=l;data.forEach((d,i)=>{rect(cursor,y,d.value/100*barW,bh,i?colors.gray:colors.blue);cursor+=d.value/100*barW;});
    data.forEach((d,i)=>{const x=mobile?l:l+i*barW*.56,labelY=mobile?75+i*65:145;text(x,labelY,d.label,'label');text(x,labelY+30,`${percent(d.value)} · ${format(d.count)} records`,'value');});
    for(let i=0;i<=4;i++)text(l+i/4*barW,y+bh+32,`${i*25}%`,'axis',i===0?'start':i===4?'end':'middle');
  } else {
    const l=mobile?8:245,r=w-(mobile?65:130),t=mobile?23:40,b=h-55,step=(b-t)/data.length;
    const max=n===10?100:Math.max(...data.map(d=>d.value))*1.04;
    data.forEach((d,i)=>{const y=t+i*step,barY=y+(mobile?23:step*.19),barH=mobile?16:Math.min(34,step*.58);text(mobile?l:l-20,mobile?y+12:barY+barH*.7,d.label,'label',mobile?'start':'end');rect(l,barY,d.value/max*(r-l),barH,valueColor(d));text(l+d.value/max*(r-l)+10,barY+barH*.8,rate?percent(d.value):format(d.value),'value');});
    text(l,h-14,n===10?'Missing age (%)':rate?'Fatal outcomes (%)':'Recorded incidents','axis');
  }
  out.push('</svg>'); return out.join('');
}
function figure(n) {
  return `<figure class="story-figure viz" id="figure-${n}" aria-labelledby="figure-${n}-title"><h2 class="viz-title" id="figure-${n}-title">${titles[n-1]}</h2><div class="chart-area">${svg(n,false)}${svg(n,true)}</div></figure>`;
}
module.exports={parseCsv,escape,stem,titles,captions,series,figure};
