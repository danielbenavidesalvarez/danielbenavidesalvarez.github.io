// data.js
(function(){
  function parseRow(d){
    return {
      Day: +d.Day,
      Day_of_Week: d.Day_of_Week,
      Time: d.Time,
      Period: d.Period, 
      Plates: +d.Plates,
      Cups: +d.Cups,
      Utensils: +d.Utensils,
      Total_Items: +d.Total_Items,
      Empty_Dishwasher: d.Empty_Dishwasher,
      Girlfriend: d.Girlfriend
    };
  }

  d3.csv('data/data.csv', parseRow).then(rows => {
    window.roommateData = rows;

    window.roommateHelpers = {
      dayTotal(day, gfFilter='All'){
        return d3.sum(rows.filter(r=>r.Day===day && (gfFilter==='All' || r.Girlfriend===gfFilter)), r=>r.Total_Items);
      },

      dayByPeriod(day, gfFilter='All'){
        const periods = ['Morning','Evening','Night'];
        return periods.map(p=>({period:p, total: d3.sum(rows.filter(r=>r.Day===day && r.Period===p && (gfFilter==='All' || r.Girlfriend===gfFilter)), r=>r.Total_Items)}));
      },
      breakdown(day, period, gfFilter='All'){
        const subset = rows.filter(r=>r.Day===day && r.Period===period && (gfFilter==='All' || r.Girlfriend===gfFilter));
        return {
          Plates: d3.sum(subset, d=>d.Plates),
          Cups: d3.sum(subset, d=>d.Cups),
          Utensils: d3.sum(subset, d=>d.Utensils)
        };
      },
      itemsByType(day, period, gfFilter='All'){
        const subset = rows.filter(r=>r.Day===day && r.Period===period && (gfFilter==='All' || r.Girlfriend===gfFilter));
        const plates = [], cups = [], utensils = [];
        subset.forEach(r=>{
          for (let i=0;i<r.Plates;i++) plates.push(r.Time);
          for (let i=0;i<r.Cups;i++) cups.push(r.Time);
          for (let i=0;i<r.Utensils;i++) utensils.push(r.Time);
        });
        return { Plates: plates, Cups: cups, Utensils: utensils };
      },
      girlfriendOptions(){
        const set = new Set(rows.map(r=>r.Girlfriend));
        return ['All', ...Array.from(set)];
      }
    };

    if (typeof window._roommate_init === 'function') window._roommate_init();
  }).catch(err => {
    console.error('Failed to load roommate CSV', err);
    d3.select('#calendar').append('p').text('Could not load data/data.csv');
  });
})();
