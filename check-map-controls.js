const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),core=require('./map-core');
const records=JSON.parse(fs.readFileSync(path.join(__dirname,'data/country_year_counts.json'),'utf8'));
class Element{
  constructor(tag='div',text=''){this.tag=tag;this.textContent=text;this.children=[];this.dataset={};this.attrs={};this.style={};this.events={};this.classList={add(){},toggle(){}};this.offsetWidth=100;this.offsetHeight=30;this.disabled=false;this.open=false;}
  append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.events[k]=fn;}querySelector(tag){return this.children.find(n=>n.tag===tag);}
  getBoundingClientRect(){return {left:0,top:0,width:800,height:420};}showModal(){this.open=true;}close(){this.open=false;this.events.close?.();}focus(){this.focused=true;}
}
async function check(loaded){
  const ids=Object.fromEntries(['country-records','map-land','map-selection','map-tooltip','map-loading','map-legend-items','map-period-summary','map-coverage','country-table','table-previous','table-next','table-page','table-period','map-table-dialog','map-table-open','map-table-close'].map(id=>[id,new Element()]));
  ids['country-records'].textContent=JSON.stringify(records);
  const ranges=core.timeRanges(records),buttons=ranges.map(r=>Object.assign(new Element('button'),{dataset:{start:String(r.start),end:String(r.end)}}));
  const stage=new Element(),handlers={};
  const document={getElementById:id=>ids[id],createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),createTextNode:text=>new Element('#text',text),querySelector:()=>stage,querySelectorAll:s=>s==='#map-periods button'?buttons:ids['country-table'].children.map(tr=>tr.children[0].children[0])};
  const countries=['United States','Australia','South Africa'].map(name=>({name,polygons:[]}));
  const context={document,CountryMap:{...core,decode(){if(!loaded)throw Error('Unavailable');return countries;}},window:{SHARK_WORLD_TOPOLOGY:{}},innerHeight:900,innerWidth:1400,addEventListener:(k,fn)=>handlers[k]=fn,setTimeout,clearTimeout};
  await vm.runInNewContext(fs.readFileSync(path.join(__dirname,'country-map.js'),'utf8'),context);
  if(loaded)assert.equal(ids['map-loading'].hidden,true);else assert.ok(ids['map-loading'].textContent.includes('View data table'));
  assert.equal(ids['map-table-dialog'].open,false,'The data table is secondary by default');
  ids['map-table-open'].events.click();assert.equal(ids['map-table-dialog'].open,true);
  ids['map-table-close'].events.click();assert.equal(ids['map-table-dialog'].open,false);assert.equal(ids['map-table-open'].focused,true);
  function tableValues(){return ids['country-table'].children.map(tr=>[tr.children[0].children[0].dataset.country,+tr.children[1].textContent.replaceAll(',','')]);}
  function allPages(){const all=[];let pages=0;do{all.push(...tableValues());if(ids['table-next'].disabled)break;ids['table-next'].events.click();assert.ok(++pages<100);}while(true);return all;}
  for(const [i,range]of ranges.entries()){
    buttons[i].events.click();const expected=core.aggregate(records,range.start,range.end),label=`${range.start}–${range.end}`;
    assert.ok(ids['map-period-summary'].textContent.startsWith(expected.total.toLocaleString('en-US')));
    assert.equal(buttons.filter(b=>b.attrs['aria-pressed']==='true').length,1);assert.equal(buttons[i].attrs['aria-pressed'],'true');
    assert.ok(ids['country-table'].children.length<=7,'Pages fit without internal scrolling');
    const values=allPages();assert.deepEqual(values,[...expected.counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),'Every recorded location is available exactly once across table pages');
    assert.equal(values.reduce((sum,r)=>sum+r[1],0),expected.total);
    if(loaded){const path=ids['map-land'].children[0],count=expected.counts.get('United States')||0;assert.equal(path.attrs.fill,core.color(count));path.events.click();assert.ok(ids['map-selection'].textContent.includes(label));path.events.click();path.events.pointermove({pointerType:'mouse',clientX:50,clientY:100});assert.ok(ids['map-tooltip'].textContent.includes(`${count.toLocaleString('en-US')} incidents (${label})`));}
  }
  buttons[0].events.click();ids['map-table-open'].events.click();const first=ids['country-table'].children[0].children[0].children[0];first.events.click();assert.ok(ids['map-selection'].textContent.includes('United States'));assert.equal(ids['map-table-dialog'].open,false,'Keyboard table selection returns to the map');
  context.innerHeight=400;context.innerWidth=740;handlers.resize();assert.ok(ids['country-table'].children.length<=3,'Short landscape uses fewer rows');
}
(async()=>{await check(true);await check(false);console.log('Map controls passed: year filters, live values/shading, complete paginated data, selection, modal focus, short screens, and offline fallback.');})().catch(error=>{console.error(error);process.exitCode=1;});
