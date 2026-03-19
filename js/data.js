// data.js — loads and parses CSV into a usable structure and exposes helpers
(function(){
  // parse numeric fields and normalize
  function parseRow(d){
    return {
      Day: +d.Day,
      Day_of_Week: d.Day_of_Week,
      Time: d.Time,
      Period: d.Period, // Morning/Evening/Night
      Plates: +d.Plates,
      Cups: +d.Cups,
      Utensils: +d.Utensils,
      Total_Items: +d.Total_Items,
      Empty_Dishwasher: d.Empty_Dishwasher,
      Girlfriend: d.Girlfriend
    };
  }

  d3.csv('data/data.csv', parseRow).then(rows => {
    // store globally
    window.roommateData = rows;

    // helper indices
    window.roommateHelpers = {
      // get total items for a given day and optional girlfriend filter ('All','Yes','No')
      dayTotal(day, gfFilter='All'){
        return d3.sum(rows.filter(r=>r.Day===day && (gfFilter==='All' || r.Girlfriend===gfFilter)), r=>r.Total_Items);
      },
      // get totals by period for a day
      dayByPeriod(day, gfFilter='All'){
        const periods = ['Morning','Evening','Night'];
        return periods.map(p=>({period:p, total: d3.sum(rows.filter(r=>r.Day===day && r.Period===p && (gfFilter==='All' || r.Girlfriend===gfFilter)), r=>r.Total_Items)}));
      },
      // get breakdown for day+period of Plates, Cups, Utensils (sums)
      breakdown(day, period, gfFilter='All'){
        const subset = rows.filter(r=>r.Day===day && r.Period===period && (gfFilter==='All' || r.Girlfriend===gfFilter));
        return {
          Plates: d3.sum(subset, d=>d.Plates),
          Cups: d3.sum(subset, d=>d.Cups),
          Utensils: d3.sum(subset, d=>d.Utensils)
        };
      },
      // get array of times for each individual item instance by type
      // returns { Plates: [time,...], Cups: [...], Utensils: [...] }
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
      // get unique girlfriend values present
      girlfriendOptions(){
        const set = new Set(rows.map(r=>r.Girlfriend));
        return ['All', ...Array.from(set)];
      }
    };

    // call init if present
    if (typeof window._roommate_init === 'function') window._roommate_init();
  }).catch(err => {
    console.error('Failed to load roommate CSV', err);
    d3.select('#calendar').append('p').text('Could not load data/data.csv');
  });
})();
