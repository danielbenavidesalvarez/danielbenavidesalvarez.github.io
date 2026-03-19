// calendar.js — render a simple 1-month calendar for days 1..30 and handle day clicks
(function(){
  function renderCalendar(gfFilter='All'){
    const dataHelpers = window.roommateHelpers;
    const container = d3.select('#calendar');
    container.html('');

    container.append('div').attr('class','month-label').text('Month (days 1–30)');

    // compute totals for days 1..30
    const days = d3.range(1,31).map(d => ({day:d, total: dataHelpers.dayTotal(d, gfFilter)}));
    const maxTotal = d3.max(days, d=>d.total) || 1;
    const color = d3.scaleLinear().domain([0,maxTotal]).range(['#f7fbff','#3182bd']);

    // grid layout with weekday columns Monday..Sunday (Sat & Sun on the right)
  const cols = 7;
  // make cells larger for a bigger calendar viz
  const cell = 110;
  const headerHeight = 36;
    const rows = Math.ceil(30/cols);
  const svgW = Math.min(1400, cols*cell + 80);
  const svgH = rows*cell + 60 + headerHeight;
    const svg = container.append('svg').attr('width', svgW).attr('height', svgH);

    // weekday labels (Monday..Sunday) — position so Sat & Sun are rightmost
    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    weekdays.forEach((w,i)=>{
      svg.append('text').attr('x', i*cell + 40 + (cell-6)/2).attr('y', 20).attr('text-anchor','middle').attr('font-size',14).attr('font-weight',600).text(w);
    });

    days.forEach(dObj => {
      const idx = dObj.day - 1;
      // Day 1 is Monday -> map day to weekday index 0..6 where 0=Mon,6=Sun
      const wd = (idx % 7 + 7) % 7; // ensures non-negative
      const weekRow = Math.floor(idx / cols);
      const x = wd * cell + 40;
      const y = headerHeight + weekRow * cell + 36;
      const rect = svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cell-20)
        .attr('height', cell-20)
        .attr('rx',6)
        .attr('class','cell')
        .style('fill', color(dObj.total))
        .style('cursor','pointer')
        .on('click', ()=> {
          // show detail for this day (pass girlfriend filter)
          const gf = d3.select('#girlfriendFilter').node() ? d3.select('#girlfriendFilter').node().value : 'All';
          if (typeof window.showDayDetail === 'function') window.showDayDetail(dObj.day, gf);
        })
        .on('mouseover', (event)=>{
          const html = `<strong>Day ${dObj.day}</strong><div class='small'>Total items left: ${dObj.total}</div>`;
          d3.select('#tooltip').html(html).style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px').transition().duration(100).style('opacity',1);
        })
        .on('mousemove', (event)=>{ d3.select('#tooltip').style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px'); })
        .on('mouseout', ()=> d3.select('#tooltip').transition().duration(100).style('opacity',0));

  svg.append('text').attr('x', x+6).attr('y', y+20).attr('font-size',18).attr('fill','#222').text(dObj.day);
    });
  }

  // expose
  window.renderCalendar = renderCalendar;
})();
