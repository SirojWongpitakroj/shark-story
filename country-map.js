(async function(){
  const core=CountryMap,records=JSON.parse(document.getElementById('country-records').textContent);
  const get=id=>document.getElementById(id),land=get('map-land'),selection=get('map-selection'),tooltip=get('map-tooltip'),stage=document.querySelector('.map-stage'),loading=get('map-loading');
  const dialog=get('map-table-dialog'),periodButtons=[...document.querySelectorAll('#map-periods button')];
  let range=core.timeRanges(records)[0],countries=[],selected='',current=core.aggregate(records,range.start,range.end),paths=[],page=0;
  const pageSize=()=>innerHeight<560?3:innerHeight<750?4:innerWidth<600?5:7;
  const rangeLabel=()=>`${range.start}–${range.end}`,fmt=n=>n.toLocaleString('en-US');
  const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  for(const bin of core.bins){const item=make('span'),swatch=make('i');swatch.style.background=bin.color;item.append(swatch,document.createTextNode(bin.label));get('map-legend-items').append(item);}
  function updateSelection(){
    for(const {country,element}of paths)element.classList.toggle('selected',country.name===selected);
    document.querySelectorAll('.country-row-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.country===selected)));
    selection.textContent=selected?`${selected} · ${fmt(current.counts.get(selected)||0)} incidents · ${rangeLabel()}`:'Hover or select a country.';
  }
  function choose(name){selected=name===selected?'':name;updateSelection();}
  function renderTable(){
    const sorted=[...current.counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),size=pageSize(),pages=Math.max(1,Math.ceil(sorted.length/size));
    page=Math.max(0,Math.min(pages-1,page));
    const tbody=get('country-table'),mapped=new Set(countries.map(c=>c.name));tbody.replaceChildren();
    for(const [name,count]of sorted.slice(page*size,(page+1)*size)){
      const tr=make('tr'),heading=make('th'),button=make('button',name+(countries.length&&!mapped.has(name)?' *':''));
      button.type='button';button.className='country-row-button';button.dataset.country=name;button.setAttribute('aria-pressed',String(name===selected));button.setAttribute('aria-label',`${name}: ${fmt(count)} incidents${countries.length&&!mapped.has(name)?', not represented on map':''}`);
      button.addEventListener('click',()=>{choose(name);dialog.close();});heading.scope='row';heading.append(button);tr.append(heading,make('td',fmt(count)));tbody.append(tr);
    }
    get('table-previous').disabled=page===0;get('table-next').disabled=page===pages-1;
    get('table-page').textContent=`${page+1} / ${pages}`;get('table-period').textContent=`${rangeLabel()} · ${fmt(current.total)} incidents`;
  }
  function render(){
    get('map-period-summary').textContent=`${fmt(current.total)} incidents · ${rangeLabel()}`;
    periodButtons.forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.start===range.start&&+b.dataset.end===range.end)));
    for(const {country,element}of paths){const count=current.counts.get(country.name)||0;element.setAttribute('fill',core.color(count));element.querySelector('title').textContent=`${country.name}: ${fmt(count)} recorded incidents (${rangeLabel()})`;}
    const stats=core.coverage(countries,current.counts);
    get('map-coverage').textContent=countries.length?`${fmt(stats.total-stats.matched)} records have locations absent from this map.`:'All recorded locations are available in the data table.';
    if(selected&&!current.counts.has(selected))selected='';
    updateSelection();renderTable();tooltip.hidden=true;
  }
  periodButtons.forEach(b=>b.addEventListener('click',()=>{range={start:+b.dataset.start,end:+b.dataset.end};current=core.aggregate(records,range.start,range.end);page=0;render();}));
  get('map-table-open').addEventListener('click',()=>{renderTable();dialog.showModal();});
  get('map-table-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>get('map-table-open').focus({preventScroll:true}));
  function paginate(direction){const id=direction>0?'table-next':'table-previous';page+=direction;renderTable();if(get(id).disabled)get(direction>0?'table-previous':'table-next').focus({preventScroll:true});}
  get('table-previous').addEventListener('click',()=>paginate(-1));get('table-next').addEventListener('click',()=>paginate(1));
  addEventListener('resize',renderTable);
  render();
  try{
    let topology=window.SHARK_WORLD_TOPOLOGY;
    if(!topology){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const response=await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json',{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Boundary download failed');topology=await response.json();}finally{clearTimeout(timeout);}}
    countries=core.decode(topology);
    for(const country of countries){
      const element=document.createElementNS('http://www.w3.org/2000/svg','path');element.setAttribute('d',core.path(country));element.setAttribute('class','country');element.setAttribute('fill-rule','evenodd');element.append(document.createElementNS('http://www.w3.org/2000/svg','title'));land.append(element);paths.push({country,element});
      element.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;tooltip.textContent=`${country.name} · ${fmt(current.counts.get(country.name)||0)} incidents (${rangeLabel()})`;tooltip.hidden=false;const rect=stage.getBoundingClientRect();tooltip.style.left=`${Math.max(8,Math.min(rect.width-tooltip.offsetWidth-8,event.clientX-rect.left+14))}px`;tooltip.style.top=`${Math.max(8,Math.min(rect.height-tooltip.offsetHeight-8,event.clientY-rect.top-40))}px`;});
      element.addEventListener('pointerleave',()=>{tooltip.hidden=true;});element.addEventListener('click',()=>{choose(country.name);tooltip.hidden=true;});
    }
    loading.hidden=true;render();
  }catch(error){loading.textContent='Map boundaries unavailable. Explore every recorded location with View data table.';loading.classList.add('map-error');}
})();
