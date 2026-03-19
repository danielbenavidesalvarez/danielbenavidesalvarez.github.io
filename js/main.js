// main.js — orchestrates UI after CSV `data/data.csv` is loaded by data.js
window._roommate_init = function(){
  const helpers = window.roommateHelpers;

  // populate girlfriend filter
  const gfSelect = d3.select('#girlfriendFilter');
  const opts = helpers.girlfriendOptions(); // e.g., ['All','Yes','No']
  gfSelect.selectAll('option').data(opts).join('option').attr('value', d=>d).text(d=> d === 'All' ? 'Show all data' : d);

  // wire events
  gfSelect.on('change', ()=>{
    const val = gfSelect.node().value;
    // re-render calendar with chosen filter
    if (typeof window.renderCalendar === 'function') window.renderCalendar(val);
  });

  // also update any open detail view when the filter changes
  gfSelect.on('change.detailUpdate', ()=>{
    const val = gfSelect.node().value;
    const cur = window._currentSelection || {};
    if (cur.day) {
      // if a period is selected, re-render that breakdown; otherwise re-render the day view
      if (cur.period && typeof window.showPeriodBreakdown === 'function') {
        window.showPeriodBreakdown(cur.day, cur.period, val);
      } else if (typeof window.showDayDetail === 'function') {
        window.showDayDetail(cur.day, val);
      }
    }
  });

  d3.select('#backToCalendar').on('click', ()=>{
    d3.select('#detail').style('display','none');
    d3.select('#calendar').style('display',null);
    d3.select('#backToCalendar').style('display','none');
  });

  // initial render: use current gf selection (default All)
  const initialGF = gfSelect.node().value || 'All';
  if (typeof window.renderCalendar === 'function') window.renderCalendar(initialGF);

  // responsive: re-render on resize to adjust SVG sizes
  window.addEventListener('resize', ()=>{ if (typeof window.renderCalendar === 'function') window.renderCalendar(d3.select('#girlfriendFilter').node().value); });
};

// If data already loaded before this script ran, initialize immediately
if (window.roommateHelpers && typeof window._roommate_init === 'function'){
  window._roommate_init();
}

