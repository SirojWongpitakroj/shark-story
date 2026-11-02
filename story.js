// One complete viewport per gesture, with no internal narrative scrolling.
(function(){
  const pages=[...document.querySelectorAll('.story-page')];
  const previous=document.getElementById('scene-previous'),next=document.getElementById('scene-next');
  const position=document.getElementById('scene-position'),announcement=document.getElementById('page-announcement');
  const progress=document.querySelector('.depth-progress'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const aliases={top:'hero/1',story:'surface/1',data:'about-data/1',about:'sources/1','conclusion/1':'resurface/1','surface/4':'surface/3','unidentified/6':'unidentified/5'};
  let active=0,animation=null,lastWheel=-Infinity,touch=null,scrollFrame=null;
  const top=page=>{let y=0;for(let el=page;el;el=el.offsetParent)y+=el.offsetTop;return y;};
  const dialogOpen=()=>Boolean(document.querySelector('dialog[open]'));
  function resolveHash(){
    let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{return -1;}
    hash=aliases[hash]||hash;
    const exact=pages.findIndex(page=>page.dataset.storyAnchor===hash);if(exact>=0)return exact;
    const target=document.getElementById(hash)?.closest?.('.story-page');
    if(target)return pages.indexOf(target);
    return pages.findIndex(page=>page.dataset.storyAnchor.split('/')[0]===hash.split('/')[0]);
  }
  function activate(index,writeHash=true){
    active=Math.max(0,Math.min(pages.length-1,index));
    const focused=document.activeElement,oldPage=focused?.closest?.('.story-page');
    if(oldPage&&oldPage!==pages[active])focused.blur();
    pages.forEach((page,i)=>{page.inert=i!==active;page.setAttribute('aria-hidden',String(i!==active));page.classList.toggle('is-active',i===active);});
    document.body.dataset.depth=pages[active].dataset.depth;
    previous.disabled=active===0;next.disabled=active===pages.length-1;
    position.textContent=`${String(active+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
    announcement.textContent=`Page ${active+1} of ${pages.length}. ${pages[active].getAttribute('aria-label')}`;
    progress.style.setProperty('--reading-progress',pages.length>1?active/(pages.length-1):0);
    const hash=`#${pages[active].dataset.storyAnchor}`;
    if(writeHash&&location.hash!==hash)history.replaceState(history.state,'',hash);
  }
  function cancel(){if(animation!==null)cancelAnimationFrame(animation);animation=null;document.documentElement.classList.remove('is-travelling');}
  function go(index,instant=false){
    index=Math.max(0,Math.min(pages.length-1,index));
    if(dialogOpen()&&index!==active)document.querySelector('dialog[open]').close();
    cancel();const start=scrollY,target=top(pages[index]);activate(index,false);
    if(instant||motion.matches||Math.abs(start-target)<1){scrollTo({top:target,behavior:'instant'});activate(index);return;}
    document.documentElement.classList.add('is-travelling');
    const began=performance.now();
    function frame(now){const t=Math.min(1,(now-began)/600),eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;scrollTo({top:start+(target-start)*eased,behavior:'instant'});if(t<1)animation=requestAnimationFrame(frame);else{animation=null;document.documentElement.classList.remove('is-travelling');activate(index);}}
    animation=requestAnimationFrame(frame);
  }
  function advance(direction){if(animation===null&&!dialogOpen())go(active+direction);}
  const editable=target=>Boolean(target?.closest?.('input,textarea,select,[contenteditable="true"],[role="slider"]'));
  addEventListener('wheel',event=>{
    if(event.ctrlKey||event.metaKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY)||editable(event.target))return;
    if(!event.cancelable)return;event.preventDefault();
    const now=performance.now(),fresh=now-lastWheel>240;lastWheel=now;
    if(fresh)advance(Math.sign(event.deltaY));
  },{passive:false});
  addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||editable(event.target)||dialogOpen())return;
    if(event.key===' '&&event.target.closest?.('a,button,summary'))return;
    const direction={ArrowDown:1,PageDown:1,ArrowUp:-1,PageUp:-1,' ':event.shiftKey?-1:1}[event.key];
    if(direction){event.preventDefault();if(!event.repeat)advance(direction);}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:pages.length-1);}
  });
  addEventListener('touchstart',event=>{touch=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY,dy:0}:null;},{passive:true});
  addEventListener('touchmove',event=>{
    if(!touch||event.touches.length!==1){touch=null;return;}
    const dy=touch.y-event.touches[0].clientY,dx=touch.x-event.touches[0].clientX;
    if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)&&!editable(event.target)&&event.cancelable){event.preventDefault();touch.dy=dy;}
  },{passive:false});
  addEventListener('touchend',()=>{if(touch&&Math.abs(touch.dy)>=32)advance(Math.sign(touch.dy));touch=null;},{passive:true});
  addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href^="#"]');if(!link)return;
    let hash;try{hash=decodeURIComponent(link.getAttribute('href').slice(1));}catch{return;}
    const index=pages.findIndex(page=>page.dataset.storyAnchor===(aliases[hash]||hash));
    if(index>=0){event.preventDefault();go(index);}
  });
  previous.addEventListener('click',()=>advance(-1));next.addEventListener('click',()=>advance(1));
  const nearest=()=>pages.reduce((best,page,i)=>Math.abs(top(page)-scrollY)<Math.abs(top(pages[best])-scrollY)?i:best,0);
  addEventListener('scroll',()=>{if(scrollFrame!==null)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=null;if(animation===null){const index=nearest();if(index!==active)activate(index);}});},{passive:true});
  addEventListener('scrollend',()=>{if(animation===null&&!dialogOpen()){const index=nearest();if(Math.abs(scrollY-top(pages[index]))>1)go(index,true);}},{passive:true});
  const restore=()=>{const index=resolveHash();if(index>=0)go(index,true);};
  addEventListener('hashchange',restore);addEventListener('popstate',restore);
  addEventListener('resize',()=>go(active,true));addEventListener('load',()=>go(active,true));
  motion.addEventListener('change',()=>{if(motion.matches)go(active,true);});
  go(Math.max(0,resolveHash()),true);
})();
