// calendar.js 
(function(){
  function renderCalendar(gfFilter='All'){
    const dataHelpers = window.roommateHelpers;
    const container = d3.select('#calendar');
    container.html('');

    container.append('div').attr('class','month-label').text('Month (days 1–30)');
    const days = d3.range(1,31).map(d => ({day:d, total: dataHelpers.dayTotal(d, gfFilter)}));
    const maxTotal = d3.max(days, d=>d.total) || 1;
  const color = d3.scaleLinear().domain([0,maxTotal]).range(['#fff5f5','#b91c1c']);
  const cols = 7;
  const headerHeight = 36;
  const vizScale = 0.75; 
  const svgW = Math.max(700, window.innerWidth - 80) * vizScale;
  const cell = Math.max(72, Math.floor((svgW - 80) / cols));
  const rows = Math.ceil(30/cols);
  const svgH = rows*cell + 60 + headerHeight;
  const svg = container.append('svg').attr('width', '100%').attr('height', svgH).attr('viewBox', `0 0 ${svgW} ${svgH}`);
    const g = svg.append('g').attr('class','calendar-g');

    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    weekdays.forEach((w,i)=>{
      g.append('text').attr('x', i*cell + 40 + (cell-6)/2).attr('y', 20).attr('text-anchor','middle').attr('font-size',Math.max(12, Math.floor(cell/8))).attr('font-weight',600).text(w);
    });
  const periodColors = { Morning: '#ffffff', Evening: '#cfe8ff', Night: '#0b3d91' };

    days.forEach(dObj => {
      const idx = dObj.day - 1;
      const wd = (idx % 7 + 7) % 7; 
      const weekRow = Math.floor(idx / cols);
      const x = wd * cell + 40;
      const y = headerHeight + weekRow * cell + 36;
      const rect = g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cell-20)
        .attr('height', cell-20)
        .attr('rx',6)
        .attr('class','cell')
        .style('fill', color(dObj.total))
        .style('cursor','pointer')
        .on('click', function(event){
          const gf = (typeof window.getGirlfriendFilter === 'function') ? window.getGirlfriendFilter() : 'All';
          d3.select('#tooltip').transition().duration(80).style('opacity',0);
          const bbox = this.getBBox();
          const centerX = bbox.x + bbox.width/2;
          const centerY = bbox.y + bbox.height/2;
          const scale = Math.min(3, Math.max(1.6, Math.min(svgW / bbox.width, svgH / bbox.height) / 2));
          const translateX = (svgW/2) - centerX * scale;
          const translateY = (svgH/2) - centerY * scale;
          g.transition().duration(700).ease(d3.easeCubicOut).attr('transform', `translate(${translateX},${translateY}) scale(${scale})`).on('end', ()=>{
            // after zoom, fade out the calendar SVG then open the full detail view
            const calSvg = d3.select('#calendar').select('svg');
            calSvg.transition().duration(280).style('opacity',0).on('end', function(){
              d3.select('#calendar').style('display','none');
              d3.select(this).style('opacity',1);
              if (typeof window.showDayDetail === 'function') window.showDayDetail(dObj.day, gf);
            });
          });
        })
        .on('mouseover', (event)=>{
          const html = `<strong>Day ${dObj.day}</strong><div class='small'>Total items left: ${dObj.total}</div>`;
          d3.select('#tooltip').html(html).style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px').transition().duration(100).style('opacity',1);
        })
        .on('mousemove', (event)=>{ d3.select('#tooltip').style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px'); })
        .on('mouseout', ()=> d3.select('#tooltip').transition().duration(100).style('opacity',0));

      g.append('text').attr('x', x+6).attr('y', y+20).attr('font-size',18).attr('fill','#222').text(dObj.day);


      try {
        const periods = dataHelpers.dayByPeriod(dObj.day, gfFilter);
        const innerPad = 8;
        const innerW = (cell-20) - innerPad*2;
        const innerH = (cell-20) - innerPad*2 - 18; // leave room for day number
        const barGap = 6;
        const barW = (innerW - (periods.length-1)*barGap) / periods.length;
        const maxP = d3.max(periods, p=>p.total) || 1;

        const miniG = g.append('g').attr('transform', `translate(${x + innerPad},${y + innerPad + 12})`);

        periods.forEach((p,i)=>{
          const h = maxP > 0 ? Math.round((p.total / maxP) * innerH) : 0;
          miniG.append('rect')
            .attr('x', i*(barW+barGap))
            .attr('y', innerH - h)
            .attr('width', Math.max(4, barW))
            .attr('height', h)
            .attr('rx',2)
            .attr('fill', periodColors[p.period] || '#bbb')
            .attr('class','mini-bar')
            .style('cursor','pointer')
            .on('click', (event)=>{
              const gf = (typeof window.getGirlfriendFilter === 'function') ? window.getGirlfriendFilter() : 'All';
              if (typeof window.showDayDetail === 'function') window.showDayDetail(dObj.day, gf);
              if (typeof window.showPeriodBreakdown === 'function') window.showPeriodBreakdown(dObj.day, p.period, gf);
            })
            .on('mouseover', (event)=>{
              const html = `<strong>${p.period}</strong><div class='small'>Total: ${p.total}</div>`;
              d3.select('#tooltip').html(html).style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px').transition().duration(80).style('opacity',1);
            })
            .on('mousemove',(event)=> d3.select('#tooltip').style('left', (event.pageX+10)+'px').style('top', (event.pageY+10)+'px'))
            .on('mouseout', ()=> d3.select('#tooltip').transition().duration(80).style('opacity',0));
        });
      } catch(e) {
        console.error('Error rendering mini charts for day', dObj.day, e);
      }
    });
  }

  window.renderCalendar = renderCalendar;
})();
