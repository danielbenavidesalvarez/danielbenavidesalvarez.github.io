// detail.js — show day detail (period distribution) and period breakdown (plates/cups/utensils)
(function(){
  // showDayDetail(day) -> renders Morning/Evening/Night totals and attaches click handlers
  function showDayDetail(day, gfFilter='All'){
    const helpers = window.roommateHelpers;
    const detail = d3.select('#detail');
    detail.html('');
    detail.style('display', null);
    d3.select('#calendar').style('display','none');
    d3.select('#backToCalendar').style('display',null);

    const periods = helpers.dayByPeriod(day, gfFilter);

    detail.append('h3').text(`Day ${day} — period distribution (Total_Items)`);
    detail.append('p').attr('class','small').text('Click a period to see plates/cups/utensils breakdown.');

    // horizontal bars for periods
    const svgW = Math.min(760, window.innerWidth-40);
    const svgH = periods.length*48 + 40;
    const svg = detail.append('svg').attr('width', svgW).attr('height', svgH);

    const maxTotal = d3.max(periods, d=>d.total) || 1;
    const x = d3.scaleLinear().domain([0,maxTotal]).range([0, svgW-220]);

    const g = svg.append('g').attr('transform','translate(160,20)');

    const rows = g.selectAll('g.row').data(periods).join('g').attr('class','row').attr('transform', (d,i)=>`translate(0,${i*48})`);

    rows.append('text').attr('x', -10).attr('y', 18).attr('text-anchor','end').text(d=>d.period);

    rows.append('rect').attr('x',0).attr('y',6).attr('width', svgW-220).attr('height',28).attr('fill','#eee').attr('rx',6);

    const fills = rows.append('rect').attr('class','bar-fill').attr('x',0).attr('y',6).attr('width',0).attr('height',28).attr('rx',6)
      .style('fill','#ff7f0e')
      .style('cursor','pointer')
      .on('click', (event,d)=>{
        // on click show breakdown for this period
        showPeriodBreakdown(day, d.period, d3.select('#girlfriendFilter').node().value || gfFilter);
      })
      .on('mouseover', (event,d)=>{
        const html = `<strong>${d.period}</strong><div class='small'>Total: ${d.total}</div>`;
        d3.select('#tooltip').html(html).style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px').transition().duration(60).style('opacity',1);
      })
      .on('mousemove',(event)=>{ d3.select('#tooltip').style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px'); })
      .on('mouseout', ()=> d3.select('#tooltip').transition().duration(60).style('opacity',0));

    // animate fills with easeBounce
    fills.transition().duration(800).ease(d3.easeBounce).attr('width', d=>x(d.total));

    rows.append('text').attr('x', d=>x(d.total)+8).attr('y', 26).text(d=>d.total).attr('fill','#222');
  }

  function showPeriodBreakdown(day, period, gfFilter='All'){
    const helpers = window.roommateHelpers;
    const detail = d3.select('#detail');

    // compute breakdown
    const b = helpers.breakdown(day, period, gfFilter);
  // get times for individual items so we can show per-icon hover times
  const timesByType = window.roommateHelpers.itemsByType(day, period, gfFilter);
  const items = [ {k:'Plates', v: b.Plates, times: timesByType.Plates}, {k:'Cups', v: b.Cups, times: timesByType.Cups}, {k:'Utensils', v: b.Utensils, times: timesByType.Utensils} ];

  // clear previous period breakdown header and lower area, then add new header
  detail.selectAll('h4.period-breakdown').remove();
  detail.selectAll('svg.period-view').remove();

  detail.append('h4').attr('class','period-breakdown').text(`${period} — plates / cups / utensils`);
    // create a visual stacked-icons view: each category shows its count as stacked SVG icons
    const svgW = Math.min(760, window.innerWidth-60);
    const svgH = 260; // fixed height for stacked icons area
    const svg = detail.append('svg').attr('class','period-view').attr('width', svgW).attr('height', svgH);

    const padLeft = 40;
    const padTop = 20;
    const availW = svgW - padLeft*2;
    const colW = availW / items.length;

    // max count to determine icon sizing
    const maxCount = d3.max(items, d=>d.v) || 1;
    const maxStackHeight = svgH - padTop - 40; // space for labels

    // for each item, render a column with stacked icons
    const cols = svg.selectAll('g.col').data(items).join('g').attr('class','col').attr('transform', (d,i)=>`translate(${padLeft + i*colW},${padTop})`);

    cols.append('text').attr('x', colW/2).attr('y', maxStackHeight + 24).attr('text-anchor','middle').text(d=>d.k);
    cols.append('text').attr('x', colW/2).attr('y', maxStackHeight + 40).attr('text-anchor','middle').attr('class','small').text(d=>`Total: ${d.v}`);

    cols.each(function(d,i){
      const group = d3.select(this);
      const count = d.v;
      // compute icon size based on available stack height
      const iconSpacing = 6;
      const maxIcons = Math.max(1, count);
      let iconSize = Math.min(40, Math.floor((maxStackHeight - (maxIcons-1)*iconSpacing) / maxIcons));
      if (iconSize < 8) iconSize = 8; // minimum

      const centerX = colW/2;

      // create a container for icons
  // bind each icon to its time (if available) so hover can show time
  const iconData = d.times && d.times.length ? d.times : d3.range(count).map(()=>null);
  const icons = group.selectAll('g.icon').data(iconData).join('g').attr('class','icon').attr('transform', `translate(${centerX},${svgH})`).style('opacity',0);

      // draw simple symbol based on category
      icons.each(function(time, idx){
        const ig = d3.select(this);
        const cx = 0;
        const cy = 0;
        if (d.k === 'Plates'){
          ig.append('circle').attr('r', iconSize/2).attr('cx', cx).attr('cy', cy).attr('fill','#fff').attr('stroke','#777').attr('stroke-width',2);
        } else if (d.k === 'Cups'){
          ig.append('rect').attr('x', -iconSize*0.4).attr('y', -iconSize*0.6).attr('width', iconSize*0.8).attr('height', iconSize*0.9).attr('rx', iconSize*0.15).attr('fill','#cfe8ff').attr('stroke','#5b9bd5');
          // little handle
          ig.append('path').attr('d', `M ${iconSize*0.4} ${-iconSize*0.2} q ${iconSize*0.2} ${iconSize*0.1} 0 ${iconSize*0.4}`).attr('stroke','#5b9bd5').attr('fill','none').attr('stroke-width',2);
        } else { // Utensils
          // draw a fork-like shape: handle and three tines
          ig.append('rect').attr('x', -iconSize*0.08).attr('y', -iconSize*0.6).attr('width', iconSize*0.16).attr('height', iconSize*0.9).attr('fill','#ddd').attr('stroke','#999');
          const tineY = -iconSize*0.6;
          const tineH = iconSize*0.25;
          const tineGap = iconSize*0.07;
          ig.append('rect').attr('x', -iconSize*0.45).attr('y', tineY).attr('width', iconSize*0.12).attr('height', tineH).attr('fill','#ddd').attr('stroke','#999');
          ig.append('rect').attr('x', -iconSize*0.06).attr('y', tineY).attr('width', iconSize*0.12).attr('height', tineH).attr('fill','#ddd').attr('stroke','#999');
          ig.append('rect').attr('x', iconSize*0.33).attr('y', tineY).attr('width', iconSize*0.12).attr('height', tineH).attr('fill','#ddd').attr('stroke','#999');
        }
        // attach hover showing time if available
        if (time) {
          ig.on('mouseover', (event)=>{
            const html = `<strong>${d.k}</strong><div class='small'>Left at: ${time}</div>`;
            d3.select('#tooltip').html(html).style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px').transition().duration(60).style('opacity',1);
          }).on('mousemove', (event)=>{ d3.select('#tooltip').style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px'); })
          .on('mouseout', ()=> d3.select('#tooltip').transition().duration(60).style('opacity',0));
        }
      });

      // position stacked icons with initial off-screen y and animate into place
      icons.transition().delay((d,i)=>i*80).duration(900).ease(d3.easeBounce).style('opacity',1)
        .attr('transform', function(_, idx){
          const y = maxStackHeight - (idx * (iconSize + iconSpacing)) - iconSize/2;
          return `translate(${centerX},${y})`;
        });
    });
  }

  // expose
  window.showDayDetail = showDayDetail;
  window.showPeriodBreakdown = showPeriodBreakdown;
})();
