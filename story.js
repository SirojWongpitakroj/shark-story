const progress=document.querySelector('.depth-progress');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let queued=false,stops=[],animation=null,lastWheel=-Infinity,touch=null;
const stopSelector='.story-screen';
const maxScroll=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
function updateProgress(){progress.style.setProperty('--reading-progress',maxScroll()?Math.min(1,Math.max(0,scrollY/maxScroll())):0);queued=false;}
function layoutTop(element){let top=0;for(let node=element;node;node=node.offsetParent)top+=node.offsetTop;return top;}
function measureStops(){
  const max=maxScroll(),positions=[0,max];
  for(const element of document.querySelectorAll(stopSelector)){
    positions.push(layoutTop(element));
  }
  for(const content of document.querySelectorAll('.screen-content')){if(content.scrollHeight>content.clientHeight+1){content.tabIndex=0;content.setAttribute('aria-label','Scroll to read the rest of this panel');}else{content.removeAttribute('tabindex');content.removeAttribute('aria-label');}}
  stops=positions.map(y=>Math.max(0,Math.min(max,Math.round(y)))).sort((a,b)=>a-b).filter((y,i,all)=>i===0||y-all[i-1]>16);
  updateProgress();
}
function cancelTravel(){if(animation!==null)cancelAnimationFrame(animation);animation=null;document.documentElement.classList.remove('is-travelling');}
function travelTo(destination){
  cancelTravel();const start=scrollY,target=Math.max(0,Math.min(maxScroll(),destination));
  if(motion.matches){scrollTo({top:target,behavior:'instant'});updateProgress();return;}
  document.documentElement.classList.add('is-travelling');
  const began=performance.now(),duration=650;
  function frame(now){const t=Math.min(1,(now-began)/duration),eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;scrollTo({top:start+(target-start)*eased,behavior:'instant'});updateProgress();if(t<1)animation=requestAnimationFrame(frame);else{animation=null;document.documentElement.classList.remove('is-travelling');}}
  animation=requestAnimationFrame(frame);
}
function nextStop(direction){if(animation!==null)return;const destination=direction>0?stops.find(y=>y>scrollY+16):[...stops].reverse().find(y=>y<scrollY-16);if(destination!==undefined)travelTo(destination);}
function nestedScroller(target,direction){
  for(let node=target instanceof Element?target:null;node&&node!==document.body;node=node.parentElement){
    if(node.matches('input,textarea,select,[contenteditable="true"],[role="slider"]'))return true;
    if(/auto|scroll/.test(getComputedStyle(node).overflowY)&&node.scrollHeight>node.clientHeight+1&&((direction>0&&node.scrollTop+node.clientHeight<node.scrollHeight-1)||(direction<0&&node.scrollTop>0)))return true;
  }return false;
}
addEventListener('wheel',event=>{
  if(event.ctrlKey||event.metaKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY)||nestedScroller(event.target,Math.sign(event.deltaY)))return;
  if(!event.cancelable)return;event.preventDefault();
  const now=performance.now(),freshGesture=now-lastWheel>180;lastWheel=now;
  if(freshGesture)nextStop(Math.sign(event.deltaY));
},{passive:false});
addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest?.('a,button,summary,input,textarea,select,[contenteditable="true"]'))return;
  const direction={ArrowDown:1,PageDown:1,ArrowUp:-1,PageUp:-1,' ':event.shiftKey?-1:1}[event.key];
  if(direction){if(nestedScroller(event.target,direction))return;event.preventDefault();nextStop(direction);}
  else if(event.key==='Home'||event.key==='End'){event.preventDefault();travelTo(event.key==='Home'?0:maxScroll());}
});
addEventListener('touchstart',event=>{touch=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY,dy:0,handled:false}:null;},{passive:true});
addEventListener('touchmove',event=>{
  if(!touch||event.touches.length!==1){touch=null;return;}
  const dy=touch.y-event.touches[0].clientY,dx=touch.x-event.touches[0].clientX;
  if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)&&!nestedScroller(event.target,Math.sign(dy))&&event.cancelable){event.preventDefault();touch.dy=dy;touch.handled=true;}
},{passive:false});
addEventListener('touchend',()=>{if(touch?.handled)nextStop(Math.sign(touch.dy));touch=null;},{passive:true});
addEventListener('touchcancel',()=>{touch=null;},{passive:true});
addEventListener('pointerdown',()=>{cancelTravel();});
addEventListener('scroll',()=>{if(!queued){requestAnimationFrame(updateProgress);queued=true;}},{passive:true});
addEventListener('resize',()=>{const active=stops.reduce((best,y,i)=>Math.abs(y-scrollY)<Math.abs(stops[best]-scrollY)?i:best,0);cancelTravel();measureStops();scrollTo({top:stops[active]||0,behavior:'instant'});});
addEventListener('load',measureStops);document.fonts?.ready.then(measureStops);measureStops();
if('IntersectionObserver' in window){
  if(!motion.matches){document.body.classList.add('motion-enabled');const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');reveal.unobserve(entry.target);}}),{threshold:0,rootMargin:'0px 0px -35px 0px'});document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));}
  const depth=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)document.body.dataset.depth=entry.target.dataset.depth;},{rootMargin:'-15% 0px -60% 0px',threshold:0});document.querySelectorAll('[data-depth]').forEach(el=>depth.observe(el));
}
motion.addEventListener('change',event=>{if(event.matches){cancelTravel();document.body.classList.remove('motion-enabled');}});
