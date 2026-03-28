// detail.js
(function(){
  function showDayDetail(day, gfFilter='All'){
  gfFilter = gfFilter || (typeof window.getGirlfriendFilter === 'function' ? window.getGirlfriendFilter() : 'All');
    const helpers = window.roommateHelpers;
    const detail = d3.select('#detail');
    detail.html('');
    detail.style('display', null);
    d3.select('#calendar').style('display','none');
    d3.select('#backToCalendar').style('display',null);
    window._currentSelection = { day, gfFilter };

    const periods = helpers.dayByPeriod(day, gfFilter);
    const periodColors = {
      Morning: '#cbffddff', 
      Evening: '#cfe8ff', 
      Night: '#0b3d91'    
    };

    detail.append('h3').text(`Day ${day} — period distribution (Total_Items)`);
    detail.append('p').attr('class','small').text('Click a period to see plates/cups/utensils breakdown.');

  const svgW = Math.max(760, window.innerWidth-80);
  const svgH = Math.max(360, Math.floor(window.innerHeight * 0.6));
  const svg = detail.append('svg').attr('width', '100%').attr('height', svgH).attr('viewBox', `0 0 ${svgW} ${svgH}`);

  const pad = {left:Math.max(60, Math.floor(svgW*0.1)), right:40, top:40, bottom:80};
    const innerW = svgW - pad.left - pad.right;
    const innerH = svgH - pad.top - pad.bottom;

    const xScale = d3.scaleBand().domain(periods.map(d=>d.period)).range([0, innerW]).padding(0.3);
    const yMax = d3.max(periods, d=>d.total) || 1;
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);


    g.selectAll('text.period-label').data(periods).join('text').attr('class','period-label').attr('x', d=>xScale(d.period) + xScale.bandwidth()/2).attr('y', innerH + 30).attr('text-anchor','middle').text(d=>d.period);


    g.append('line').attr('x1',0).attr('x2',innerW).attr('y1',innerH).attr('y2',innerH).attr('stroke','#ddd');

    const bars = g.selectAll('g.bar').data(periods).join('g').attr('class','bar').attr('transform', d=>`translate(${xScale(d.period)},0)`);

    bars.append('rect').attr('x',0).attr('y', innerH).attr('width', xScale.bandwidth()).attr('height',0).attr('fill', d=> periodColors[d.period] || '#bbb').style('cursor','pointer')
      .on('click', (event,d)=>{
        const curGF = (typeof window.getGirlfriendFilter === 'function') ? window.getGirlfriendFilter() : gfFilter;
        showPeriodBreakdown(day, d.period, curGF || gfFilter);
      })
      .on('mouseover', (event,d)=>{
        const html = `<strong>${d.period}</strong><div class='small'>Total: ${d.total}</div>`;
        d3.select('#tooltip').html(html).style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px').transition().duration(60).style('opacity',1);
      })
      .on('mousemove', (event)=> d3.select('#tooltip').style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px'))
      .on('mouseout', ()=> d3.select('#tooltip').transition().duration(60).style('opacity',0));


    bars.select('rect').transition().duration(900).ease(d3.easeBounce).attr('y', d=>yScale(d.total)).attr('height', d=> innerH - yScale(d.total));


    bars.append('text').attr('x', xScale.bandwidth()/2).attr('y', d=> yScale(d.total) - 8).attr('text-anchor','middle').text(d=>d.total).attr('fill','#222');
  }

  function showPeriodBreakdown(day, period, gfFilter='All'){

  gfFilter = gfFilter || (typeof window.getGirlfriendFilter === 'function' ? window.getGirlfriendFilter() : 'All');
    const helpers = window.roommateHelpers;
    const detail = d3.select('#detail');


    window._currentSelection = Object.assign(window._currentSelection || {}, { day, period, gfFilter });


    const b = helpers.breakdown(day, period, gfFilter);

  const timesByType = window.roommateHelpers.itemsByType(day, period, gfFilter);
  const items = [ {k:'Plates', v: b.Plates, times: timesByType.Plates}, {k:'Cups', v: b.Cups, times: timesByType.Cups}, {k:'Utensils', v: b.Utensils, times: timesByType.Utensils} ];

  detail.selectAll('h4.period-breakdown').remove();
  detail.selectAll('svg.period-view').remove();

  detail.append('h4').attr('class','period-breakdown').text(`${period} — plates / cups / utensils`);
    const svgW = Math.min(760, window.innerWidth-60);
    const svgH = 260; 
    const svg = detail.append('svg').attr('class','period-view').attr('width', svgW).attr('height', svgH);

    const padLeft = 40;
    const padTop = 20;
    const availW = svgW - padLeft*2;
    const colW = availW / items.length;


    const maxCount = d3.max(items, d=>d.v) || 1;
    const maxStackHeight = svgH - padTop - 40; 


    const cols = svg.selectAll('g.col').data(items).join('g').attr('class','col').attr('transform', (d,i)=>`translate(${padLeft + i*colW},${padTop})`);

    cols.append('text').attr('x', colW/2).attr('y', maxStackHeight + 24).attr('text-anchor','middle').text(d=>d.k);
    cols.append('text').attr('x', colW/2).attr('y', maxStackHeight + 40).attr('text-anchor','middle').attr('class','small').text(d=>`Total: ${d.v}`);

    cols.each(function(d,i){
      const group = d3.select(this);
      const count = d.v;
      const iconSpacing = 6;
      const maxIcons = Math.max(1, count);
      let iconSize = Math.min(40, Math.floor((maxStackHeight - (maxIcons-1)*iconSpacing) / maxIcons));
      if (iconSize < 8) iconSize = 8; 

      const centerX = colW/2;


  const iconData = d.times && d.times.length ? d.times : d3.range(count).map(()=>null);
  const icons = group.selectAll('g.icon').data(iconData).join('g').attr('class','icon').attr('transform', `translate(${centerX},${svgH})`).style('opacity',0);

      icons.each(function(time, idx){
        const ig = d3.select(this);
        let emoji = '•';
        if (d.k === 'Plates') emoji = '🍽️';
        else if (d.k === 'Cups') emoji = '☕';
        else if (d.k === 'Utensils') emoji = '🍴';

        ig.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .style('font-size', `${iconSize}px`)
          .text(emoji);
        if (time) {
          ig.on('mouseover', (event)=>{
            const html = `<strong>${d.k}</strong><div class='small'>Left at: ${time}</div>`;
            d3.select('#tooltip').html(html).style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px').transition().duration(60).style('opacity',1);
          }).on('mousemove', (event)=>{ d3.select('#tooltip').style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px'); })
          .on('mouseout', ()=> d3.select('#tooltip').transition().duration(60).style('opacity',0));
        }
      });

      icons.transition().delay((d,i)=>i*80).duration(900).ease(d3.easeBounce).style('opacity',1)
        .attr('transform', function(_, idx){
          const y = maxStackHeight - (idx * (iconSize + iconSpacing)) - iconSize/2;
          return `translate(${centerX},${y})`;
        });
    });
  }

  window.showDayDetail = showDayDetail;
  window.showPeriodBreakdown = showPeriodBreakdown;
})();
