// main.js 
window._roommate_init = function(){
  const helpers = window.roommateHelpers;

  // girlfriend filter state and handlers
  window._gfSelection = 'All';
  window.getGirlfriendFilter = function(){ return window._gfSelection || 'All'; };

  const btnNo = d3.select('#gfNo');
  const btnYes = d3.select('#gfYes');
  const btnAll = d3.select('#gfAll');

  function setGF(val){
    window._gfSelection = val;
    btnNo.classed('active', val === 'No');
    btnYes.classed('active', val === 'Yes');
    btnAll.classed('active', val === 'All');
    if (typeof window.renderCalendar === 'function') window.renderCalendar(val);
    const cur = window._currentSelection || {};
    if (cur.day) {
      if (cur.period && typeof window.showPeriodBreakdown === 'function') {
        window.showPeriodBreakdown(cur.day, cur.period, val);
      } else if (typeof window.showDayDetail === 'function') {
        window.showDayDetail(cur.day, val);
      }
    }
  }

  btnNo.on('click', ()=> setGF('No'));
  btnYes.on('click', ()=> setGF('Yes'));
  btnAll.on('click', ()=> setGF('All'));

  d3.select('#backToCalendar').on('click', ()=>{
    const calendar = d3.select('#calendar');
    calendar.style('display', null);
    const g = calendar.select('svg .calendar-g');
    if (!g.empty()) {
      g.transition().duration(700).ease(d3.easeCubicOut).attrTween('transform', function(){
        const start = d3.select(this).attr('transform') || '';
        const interp = d3.interpolateString(start, 'translate(0,0) scale(1)');
        return function(t){ return interp(t); };
      }).on('end', ()=>{
        d3.select('#detail').style('display','none');
        d3.select('#backToCalendar').style('display','none');
      });
    } else {
      d3.select('#detail').style('display','none');
      d3.select('#backToCalendar').style('display','none');
    }
  });

  // Default
  if (typeof window.renderCalendar === 'function') window.renderCalendar(window.getGirlfriendFilter());

  // Re render done by the LLM
  window.addEventListener('resize', ()=>{ if (typeof window.renderCalendar === 'function') window.renderCalendar(window.getGirlfriendFilter()); });
};


