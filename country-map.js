(async function(){
  const core=CountryMap,records=JSON.parse(document.getElementById('country-records').textContent);
  const land=document.getElementById('map-land'),selection=document.getElementById('map-selection'),tooltip=document.getElementById('map-tooltip'),stage=document.querySelector('.map-stage'),loading=document.getElementById('map-loading');
  let activeRange=core.timeRanges(records)[0];
  let countries=[],selected='',current=core.aggregate(records,activeRange.start,activeRange.end),paths=[];
  const rangeLabel=()=>`${activeRange.start}\u2013${activeRange.end}`;
  const periodButtons=[...document.querySelectorAll('#map-periods button')];
  const fmt=n=>n.toLocaleString('en-US');
  const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  for(const bin of core.bins){const item=make('span'),swatch=make('i');swatch.style.background=bin.color;item.append(swatch,document.createTextNode(bin.label));document.getElementById('map-legend-items').append(item);}
  function choose(name){selected=name===selected?'':name;for(const {country,element}of paths)element.classList.toggle('selected',country.name===selected);document.querySelectorAll('.country-row-button').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.country===selected));});selection.textContent=selected?`${selected} · ${fmt(current.counts.get(selected)||0)} recorded incidents (${rangeLabel()})`:'\u00a0';}
  function render(){
    document.getElementById('map-period-label').textContent=rangeLabel();
    document.getElementById('map-period-summary').textContent=`${fmt(current.total)} recorded incidents \u00b7 ${rangeLabel()}`;
    for(const button of periodButtons)button.setAttribute('aria-pressed',String(+button.dataset.start===activeRange.start&&+button.dataset.end===activeRange.end));
    for(const {country,element} of paths){const count=current.counts.get(country.name)||0;element.setAttribute('fill',core.color(count));element.querySelector('title').textContent=`${country.name}: ${fmt(count)} recorded incidents (${rangeLabel()})`;}
    const stats=core.coverage(countries,current.counts);
    document.getElementById('map-coverage').textContent=countries.length?`${fmt(stats.total-stats.matched)} records have locations not represented on this map.`:`${fmt(stats.total)} records · ${rangeLabel()}`;
    const tbody=document.getElementById('country-table');tbody.replaceChildren();const mapped=new Set(countries.map(c=>c.name));for(const [name,count]of [...current.counts].sort((a,b)=>b[1]-a[1])){const tr=make('tr'),heading=make('th'),button=make('button',name+(countries.length&&!mapped.has(name)?' *':''));button.type='button';button.className='country-row-button';button.dataset.country=name;button.setAttribute('aria-label',`${name}: ${fmt(count)} incidents${countries.length&&!mapped.has(name)?', not represented on map':''}`);button.addEventListener('click',()=>choose(name));heading.scope='row';heading.append(button);tr.append(heading,make('td',fmt(count)));tbody.append(tr);}
    const previous=selected;selected='';choose(previous);tooltip.hidden=true;
  }
  for(const button of periodButtons)button.addEventListener('click',()=>{
    activeRange={start:+button.dataset.start,end:+button.dataset.end};
    current=core.aggregate(records,activeRange.start,activeRange.end);
    render();document.querySelector('.map-table-scroll').scrollTop=0;
  });
  render();
  try{
    let topology=window.SHARK_WORLD_TOPOLOGY;
    if(!topology){
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
      try{const response=await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json',{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Boundary download failed');topology=await response.json();}finally{clearTimeout(timeout);}
    }
    countries=core.decode(topology);
    for(const country of countries){const element=document.createElementNS('http://www.w3.org/2000/svg','path');element.setAttribute('d',core.path(country));element.setAttribute('class','country');element.setAttribute('fill-rule','evenodd');const title=document.createElementNS('http://www.w3.org/2000/svg','title');element.append(title);land.append(element);paths.push({country,element});
      element.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;tooltip.textContent=`${country.name} · ${fmt(current.counts.get(country.name)||0)} incidents (${rangeLabel()})`;tooltip.hidden=false;const rect=stage.getBoundingClientRect();tooltip.style.left=`${Math.max(8,Math.min(rect.width-tooltip.offsetWidth-8,event.clientX-rect.left+14))}px`;tooltip.style.top=`${Math.max(8,event.clientY-rect.top-50)}px`;});
      element.addEventListener('pointerleave',()=>{tooltip.hidden=true;});element.addEventListener('click',()=>{choose(country.name);tooltip.hidden=true;});
    }
    loading.hidden=true;render();
  }catch(error){loading.textContent='Connect to the internet and reload to see the map. Country counts are available in the table.';loading.classList.add('map-error');}
})();
