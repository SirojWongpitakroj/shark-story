const fs=require('node:fs'),path=require('node:path');
const {titles,figure,escape}=require('./presentation-charts');
const mapMarkup=require('./map-markup'),chapters=require('./story-chapters'),pagesForChapter=require('./story-pages');
// This directory is the Git repository and the site root. All inputs are local.
const dist=__dirname;
const audit=JSON.parse(fs.readFileSync(path.join(dist,'data/cleaning_audit.json'),'utf8'));
const eyebrow=text=>text?`<p class="eyebrow">${text}</p>`:'';
function content(page){
  if(page.kind==='hero')return `<div class="hero"><p class="eyebrow">Shark Attacks</p><h1>Perception<br><span class="muted">vs</span> Reality<span class="accent">.</span></h1><p class="hero-subtitle">Are sharks becoming more dangerous,<br>or are we simply recording more encounters?</p><a class="dive-link" href="#surface/1">Dive into the data <span aria-hidden="true">↓</span></a><p class="hero-meta">${audit.cleanedRows.toLocaleString('en-US')} recorded encounters · 1800–2018 · worldwide</p></div>`;
  if(page.kind==='figure')return page.figure===3?mapMarkup():figure(page.figure);
  if(page.kind==='explanation')return `<div class="explanation-content"><p>${page.copy}</p></div>`;
  if(page.kind==='comparison')return `<div class="comparison-content comparison-${page.side}">${eyebrow(page.eyebrow)}<h2>${page.title}</h2><div class="comparison-pair"><div><h3>${page.side==='perception'?'Perception':'Reality'}</h3><p>${page[page.side]}</p></div></div></div>`;
  if(page.kind==='resource')return `<div class="resource-content">${eyebrow(page.eyebrow||'About the Data')}<h2>${page.title}</h2>${page.html||''}${page.points?`<ul class="method-list">${page.points.map(p=>`<li>${p}</li>`).join('')}</ul>`:''}</div>`;
  return `<div class="statement-content">${eyebrow(page.eyebrow)}${page.lead?`<p class="chapter-lead">${page.lead}</p>`:''}<h2>${page.title}</h2>${page.copy?`<p class="explanation">${page.copy}</p>`:''}${page.question?`<h3 class="followup-question">${page.question}</h3>`:''}</div>`;
}
let pageNumber=0;
function renderPage(page,chapter,number,depth){
  const hash=`${chapter}/${number}`,label=page.kind==='figure'?titles[page.figure-1]:(page.title||page.copy)?.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&')||'Shark Attacks: Perception vs Reality';
  return `<div class="story-page page-${page.kind}${page.copy||page.lead?' page-context':''}${page.emphasis?' page-emphasis':''}${page.question?' page-followup':''}${page.topic?' page-topic':''}${page.closing?' page-closing':''}" id="${hash}" data-story-anchor="${hash}" data-page="${pageNumber++}" data-depth="${depth}" aria-label="${escape(label)}" aria-roledescription="story page"><div class="page-content">${content(page)}</div></div>`;
}
const rendered=chapters.map(chapter=>`<section class="story-chapter chapter-${chapter.id}" id="${chapter.id}" data-chapter="${chapter.id}" aria-label="${escape(chapter.label)}">${pagesForChapter(chapter).map((page,i)=>renderPage(page,chapter.id,i+1,chapter.depth)).join('\n')}</section>`);
const dataPages=[
  {title:'About the Data',html:`<p>The analysis uses ${audit.cleanedRows.toLocaleString('en-US')} records from 1800 to June 25, 2018.</p><p>Counts describe reported encounters. The dataset does not measure ocean exposure or individual attack risk.</p>`}
];
const sourcePages=[
  {title:'Data &amp; Sources',html:`<nav class="source-links" aria-label="Dataset source"><a href="https://www.kaggle.com/datasets/teajay/global-shark-attacks/data" target="_blank" rel="noopener">Global Shark Attacks · Kaggle ↗</a></nav>`}
];
const sources=`<footer class="data-sources" id="sources">${dataPages.map((p,i)=>renderPage({kind:'resource',...p},'about-data',i+1,'surface')).join('\n')}${sourcePages.map((p,i)=>renderPage({kind:'resource',eyebrow:'Behind the story',...p},'sources',i+1,'surface')).join('\n')}</footer>`;
const cached=fs.existsSync(path.join(dist,'world-boundaries.js'))?'<script src="world-boundaries.js" defer></script>':'';
fs.writeFileSync(path.join(dist,'index.html'),`<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#031722"><meta name="description" content="An immersive visual story about recorded shark encounters, fatality, and gaps in historical data."><title>Shark Attacks: Perception vs Reality</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="screens.css"><link rel="stylesheet" href="map.css"><script src="screens.js" defer></script><script src="story.js" defer></script><script src="map-core.js" defer></script>${cached}<script src="country-map.js" defer></script></head><body><a class="skip-link" href="#surface/1">Skip to the story</a><div class="underwater-light" aria-hidden="true"></div><main id="top">${rendered.join('\n')}</main>${sources}<nav class="scene-navigation" aria-label="Page navigation"><button id="scene-previous" type="button" aria-label="Previous page">↑</button><span id="scene-position" aria-live="off"></span><button id="scene-next" type="button" aria-label="Next page">↓</button></nav><div class="depth-progress" aria-hidden="true"><span class="depth-dot"></span></div><div class="sr-only" id="page-announcement" aria-live="polite" aria-atomic="true"></div><noscript><p class="no-js-note">Enable JavaScript for page controls and the interactive map.</p></noscript></body></html>`);
console.log(`Built ${pageNumber} isolated viewport pages across ${chapters.length} story chapters, plus data and sources.`);
