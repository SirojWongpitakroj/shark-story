// Keep the chapter investigation, but give each visual or related idea its own page.
module.exports = function pagesForChapter(chapter) {
  if (chapter.hero) return [{kind:'hero'}];
  const pages=[];
  for(const step of chapter.steps){
    if(step.comparison){pages.push({kind:'comparison',...step,side:'perception'},{kind:'comparison',...step,side:'reality'});continue;}
    const {eyebrow,lead,title,bridge,copy,secondTitle,emphasis,question}=step;
    if(eyebrow||lead||title||bridge||copy)pages.push({kind:step.reveal?'reveal':'text',eyebrow,lead,title:title||bridge,copy,emphasis,question});
    if(secondTitle)pages.push({kind:'reveal',title:secondTitle,emphasis:true});
    if(step.explanation)pages.push({kind:'explanation',copy:step.explanation});
    if(step.figure)pages.push({kind:'figure',figure:step.figure});
    if(step.takeaway)pages.push({kind:'text',title:step.takeaway,copy:step.note});
    if(step.interpretation)pages.push({kind:'text',eyebrow:step.interpretationTopic,topic:Boolean(step.interpretationTopic),title:step.interpretation,copy:step.interpretationNote});
    if(step.closing)pages.push({kind:'text',title:step.closing,closing:true});
  }
  return pages;
};
