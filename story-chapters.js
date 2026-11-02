// One investigation, nine chapters. story-pages.js separates content into viewport pages.
module.exports = [
  {id:'hero',label:'Hero',depth:'surface',hero:true},
  {id:'surface',label:'The Surface',depth:'surface',steps:[
    {title:'Shark attacks appear<br>to be <em>increasing.</em>',eyebrow:'01 · THE SURFACE',copy:'The historical record contains more reported encounters in later years.',figure:1},
    {title:'Far more encounters appear in recent decades of the record.',question:'So the ocean is becoming <em>more dangerous… right?</em>'}
  ]},
  {id:'fatality',label:'Beneath the Surface',depth:'middle',steps:[
    {eyebrow:'02 · BENEATH THE SURFACE',title:'More recorded attacks does not mean <em>more deadly attacks.</em>',figure:2},
    {reveal:true,emphasis:true,title:'Encounters <em aria-label="increased">↑</em><br> Fatality <span class="warm" aria-label="decreased">↓</span>'},
    {title:'More sightings in the record do not automatically mean <em>more danger in the water.</em>',copy:'So what shapes the encounters we see?'}
  ]},
  {id:'where',label:'Where',depth:'middle',steps:[
    {eyebrow:'03 · WHERE',lead:'If time alone does not explain the danger, we need to look at the circumstances surrounding each encounter.',title:'Where do they happen?',figure:3,takeaway:'Recorded incidents are not the same as individual attack risk.',note:'Population, coastline, tourism, and time in the ocean differ between countries.'}
  ]},
  {id:'activity',label:'The Human Side',depth:'middle',steps:[
    {eyebrow:'04 · THE HUMAN SIDE',lead:'Location tells us where encounters were recorded—but not what people were doing when they happened.',title:'What were people doing?',figure:4},
    {bridge:'But frequency and severity are different questions.',figure:5,takeaway:'Common does not necessarily mean deadly.'}
  ]},
  {id:'species',label:'The Species',depth:'deep',steps:[
    {eyebrow:'05 · THE SPECIES',lead:'Human activity explains part of the encounter. But an encounter also has another participant.',title:'What about the shark?',figure:6,takeaway:'But there is a problem.',note:'The largest “species” category is not a species at all. Many incidents could not identify the shark involved.'},
    {bridge:'But frequency does not tell us severity.',copy:'First, compare the species that were identified.',figure:7,takeaway:'Frequency ≠ severity'}
  ]},
  {id:'unidentified',label:'Something Doesn’t Fit',depth:'deep',steps:[
    {eyebrow:'06 · SOMETHING DOESN’T FIT',title:'Then one category<br><em>stands out.</em>',copy:'Now return to the group we left out: incidents with an unidentified shark.',figure:8,takeaway:'Why would incidents with an unidentified shark show a different outcome pattern?',note:'One possibility is that a severe incident leaves fewer opportunities for witnesses or victims to identify the shark accurately. This dataset does not establish that explanation.'},
    {reveal:true,title:'Maybe the answer isn’t about sharks at all.'},
    {reveal:true,emphasis:true,title:'Maybe it is<br>about <em>the data.</em>'}
  ]},
  {id:'data-gaps',label:'The Record Has Gaps',depth:'deep',steps:[
    {eyebrow:'07 · THE RECORD HAS GAPS',lead:'And species identification is not the only information that goes missing.',title:'The historical record has gaps.',figure:9,takeaway:'A substantial share of recorded incidents lacks usable victim-age information.'},
    {bridge:'But those gaps are not distributed evenly.',figure:10,takeaway:'Missing data is part of the story.',note:'If some types of incidents are documented less completely than others, analyses using only the available information may give an incomplete picture.',interpretationTopic:'Survivorship Bias',interpretation:'Historical records tell us <em>what was documented</em>—not necessarily everything that happened.',interpretationNote:'Reporting practices, survivorship, missing information, and changes in documentation can all shape the patterns we see.'}
  ]},
  {id:'resurface',label:'Resurface',depth:'surface',steps:[
    {comparison:true,eyebrow:'08 · RESURFACE',title:'Perception vs Reality',perception:'More shark attacks are being recorded, so sharks must be becoming more dangerous.',reality:'Recorded encounters increased, while fatality declined, and the historical record contains substantial gaps.'},
    {reveal:true,final:true,title:'More recorded shark attacks do not necessarily mean <em>a more dangerous ocean.</em>',copy:'Incident frequency, severity, human activity, species identification, geography, and the quality of historical reporting all shape the story we see.',closing:'Data tells a story—but the gaps in the data tell one too.'}
  ]}
];
