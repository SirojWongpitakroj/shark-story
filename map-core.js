/* Country geometry: Natural Earth / world-atlas 2.0.2. No incident coordinates inferred. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CountryMap=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const aliases={'united states of america':'United States','united states':'United States','columbia':'Colombia','colombia':'Colombia','solomon is':'Solomon Islands','falkland is':'Falkland Islands','dominican rep':'Dominican Republic','trinidad and tobago':'Trinidad and Tobago','united arab emirates uae':'United Arab Emirates','reunion island':'Réunion','reunion':'Réunion','eq guinea':'Equatorial Guinea','central african rep':'Central African Republic','bosnia and herz':'Bosnia and Herzegovina'};
  const normalize=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
  const canonical=name=>aliases[normalize(name)]||name;
  function aggregate(rows,start=1800,end=Infinity){const counts=new Map();let total=0;for(const [year,name,count] of rows){if(year<start||year>end)continue;const key=canonical(name);counts.set(key,(counts.get(key)||0)+count);total+=count;}return {counts,total};}
  function timeRanges(rows){
    const years=rows.map(row=>row[0]),first=Math.min(...years),last=Math.max(...years);
    const ranges=[{start:first,end:last,label:'All years'}];
    for(let start=Math.floor(first/50)*50;start<=last;start+=50){const end=Math.min(start+49,last);ranges.push({start:Math.max(start,first),end,label:`${Math.max(start,first)}\u2013${end}`});}
    return ranges;
  }
  function decode(topology){
    if(topology.type!=='Topology'||!topology.objects?.countries)throw Error('Country boundaries unavailable');
    const arcs=topology.arcs.map(arc=>{let x=0,y=0;return arc.map(p=>{if(!topology.transform)return p; x+=p[0];y+=p[1];return [x*topology.transform.scale[0]+topology.transform.translate[0],y*topology.transform.scale[1]+topology.transform.translate[1]];});});
    function ring(ids){const points=[];for(const id of ids){const part=id<0?[...arcs[~id]].reverse():arcs[id];points.push(...(points.length?part.slice(1):part));}return points;}
    return topology.objects.countries.geometries.filter(g=>g.properties?.name!=='Antarctica').map(g=>({id:g.id,name:canonical(g.properties.name),polygons:(g.type==='Polygon'?[g.arcs]:g.arcs).map(p=>p.map(ring))}));
  }
  // Robinson interpolation adapted from d3-geo-projection; see map-LICENSE.txt.
  // One scale for both axes preserves the projection's proportions.
  const robinson=[
    [.9986,-.062],[1,0],[.9986,.062],[.9954,.124],[.9900,.186],
    [.9822,.248],[.9730,.310],[.9600,.372],[.9427,.434],[.9216,.4958],
    [.8962,.5571],[.8679,.6176],[.8350,.6769],[.7986,.7346],[.7597,.7903],
    [.7186,.8435],[.6732,.8936],[.6213,.9394],[.5722,.9761],[.5322,1]
  ];
  function project(lon,lat){
    const index=Math.min(18,Math.abs(lat)/5),base=Math.floor(index),t=index-base;
    const a=robinson[base],b=robinson[base+1],c=robinson[Math.min(19,base+2)];
    const interpolate=axis=>b[axis]+t*(c[axis]-a[axis])/2+t*t*(c[axis]-2*b[axis]+a[axis])/2;
    return [500+152*lon*Math.PI/180*interpolate(0),270-152*Math.sign(lat)*1.593415793900743*interpolate(1)];
  }
  function path(country){return country.polygons.map(polygon=>polygon.map(ring=>ring.map(([lon,lat],i)=>`${i?'L':'M'}${project(lon,lat).map(n=>n.toFixed(2)).join(',')}`).join(' ')+'Z').join(' ')).join(' ');}
  const bins=[{min:0,label:'No matched records',color:'#142d39'},{min:1,label:'1–49',color:'#31758c'},{min:50,label:'50–499',color:'#58b6c9'},{min:500,label:'500+',color:'#9ee7e5'}];
  const color=count=>[...bins].reverse().find(b=>count>=b.min).color;
  function coverage(countries,counts){const names=new Set(countries.map(c=>c.name));const unmatched=[...counts].filter(([name])=>!names.has(name)).sort((a,b)=>b[1]-a[1]);const total=[...counts.values()].reduce((a,b)=>a+b,0);return {unmatched,matched:total-unmatched.reduce((sum,d)=>sum+d[1],0),total};}
  return {canonical,aggregate,timeRanges,decode,project,path,bins,color,coverage};
});
