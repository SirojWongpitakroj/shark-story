// Group related narrative beats into isolated viewport-sized panels.
// Move the original nodes so figure data and event targets remain intact.
(function(){
  const main=document.querySelector('main');
  const selector='.hero,.chapter-heading,.story-figure,.after-chart,.pause .narrow,.bridge,.statement,.reversal p,.data-reveal>.narrow,.interpretation>p,.answer,.findings,.final-message>.narrow>*,.data-section>.narrow,footer';
  let lastDepth='surface';
  const beats=[...document.querySelectorAll(selector)].map(node=>({
    node,depth:(lastDepth=node.closest('[data-depth]')?.dataset.depth||lastDepth),
    kind:node.matches('.hero')?'hero':node.matches('footer')?'footer':node.closest('.final-message')?'final':node.closest('.pause,.interpretation')?'pause':node.matches('.story-figure')?'figure':'text',
    anchor:node.matches('.chapter-heading')&&node.closest('#story')?'story':node.closest('#data')?'data':null
  }));
  const groups=[];let pending=[];
  const append=beat=>groups[groups.length-1].beats.push(beat);
  const start=beat=>{groups.push({beats:[...pending,beat],kind:beat.kind,depth:beat.depth});pending=[];};
  for(const beat of beats){
    const {node}=beat;
    const highlighted=Boolean(node.querySelector('em,.accent,.closing-line'))||node.matches('.closing-line')||Boolean(node.closest('.reversal'));
    if(!highlighted&&!node.matches('.hero,.story-figure,.findings,footer')&&!node.closest('.data-section,.final-message'))node.classList.add('panel-support');
    if(beat.kind==='final'){
      if(groups.at(-1)?.kind==='final')append(beat);else start(beat);
    }else if(node.closest('.data-section')){
      beat.kind='resources';start(beat);
    }else if(node.matches('footer')){
      if(groups.at(-1)?.kind==='resources')append(beat);else start(beat);
    }else if(node.matches('.after-chart,.findings')||node.closest('.interpretation')||(node.matches('.statement')&&!highlighted)){
      if(groups.length)append(beat);else pending.push(beat);
    }else if(node.closest('.reversal')){
      if(groups.at(-1)?.kind==='reversal')append(beat);else{beat.kind='reversal';start(beat);}
    }else if(node.matches('.hero,.story-figure')||highlighted){
      start(beat);
    }else{
      // Plain questions and bridges introduce the next highlighted idea/figure.
      pending.push(beat);
    }
  }
  if(pending.length&&groups.length)groups.at(-1).beats.push(...pending);
  const fragment=document.createDocumentFragment();
  groups.forEach(({beats:group,depth,kind},index)=>{
    const screen=document.createElement('section');screen.className=`story-screen screen-${kind}`;screen.dataset.depth=depth;screen.dataset.screen=String(index);
    if(group.length>1)screen.classList.add('screen-grouped');
    const anchor=group.find(beat=>beat.anchor)?.anchor;
    if(anchor)screen.id=anchor;
    screen.setAttribute('aria-label',`Story panel ${index+1} of ${groups.length}`);
    const content=document.createElement('div');content.className='screen-content';
    for(const {node}of group){if(node.matches('footer'))node.setAttribute('role','contentinfo');content.append(node);}
    screen.append(content);fragment.append(screen);
  });
  main.replaceChildren(fragment);
  document.documentElement.classList.add('story-paged');
  const restoreAnchor=()=>{if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));target?.closest('.story-screen')?.scrollIntoView({behavior:'instant',block:'start'});}};
  addEventListener('hashchange',restoreAnchor);requestAnimationFrame(restoreAnchor);
})();
