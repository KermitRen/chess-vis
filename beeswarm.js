// document.addEventListener("DOMContentLoaded", draw("nyide"));
draw("original")

function draw(chart) {
  if (chart=="nyide")
    fetch("data/lichess.json")
      .then(response => response.json())
      .then(data => AggregateData(data))
      .then(data => newBeeswarmChart(data, { 
        winrate: d => (d.whiteWins - d.blackWins)/(d.blackWins+d.whiteWins+d.draws), 
        opening: d => d.name,
        whiteperc: d => 100*d.whiteWins/(d.whiteWins + d.blackWins + d.draws),
        blackperc: d => 100*d.blackWins/(d.whiteWins + d.blackWins + d.draws),
        wincolor: d => (d.whiteWins/(d.whiteWins + d.blackWins + d.draws)>(d.blackWins/(d.whiteWins + d.blackWins + d.draws)))?"White":"Black"
  }));
  if (chart=="original")
    fetch("data/lichess.json")
      .then(response => response.json())
      .then(data => AggregateData(data))
      .then(data => originalBeeswarmChart(data, { 
        winrate: d => (d.whiteWins - d.blackWins)/(d.blackWins+d.whiteWins+d.draws), 
        opening: d => d.name,
        whiteperc: d => 100*d.whiteWins/(d.whiteWins + d.blackWins + d.draws),
        blackperc: d => 100*d.blackWins/(d.whiteWins + d.blackWins + d.draws),
        wincolor: d => (d.whiteWins/(d.whiteWins + d.blackWins + d.draws)>(d.blackWins/(d.whiteWins + d.blackWins + d.draws)))?"White":"Black"
}));

}

function AggregateData(data) {
    let openings = []
    for (let i = 0; i<data.length; i++) {
        let game = data[i]
        let opening = openings.find(x => x.name == game.Opening)
        if (opening) {
            opening.whiteWins += game.Result == 0?1:0
            opening.blackWins += game.Result == 1?1:0
            opening.draws += game.Result == 2?1:0
        } else {
            let whiteWin = game.Result == 0?1:0
            let blackWin = game.Result == 1?1:0
            let draw = game.Result == 2?1:0
            let newOpening = {name: game.Opening, whiteWins: whiteWin, blackWins: blackWin, draws: draw} 
            openings.push(newOpening)
        }
    }
    // console.log(openings[0])
    return openings
}

function newBeeswarmChart(data, {
  label =  "Winrate in percent", // convenience alias for xLabel
  domain, // convenience alias for xDomain
  
  value = d => d, // convience alias for x
  winrate = value, // given d in data, returns the quantitative x value
  
  openingname = d => d, // value for opening name
  opening = openingname, // given d in data, returns the title

  whitewinperc = d => d,
  whiteperc = whitewinperc,
  blackwinperc = d => d,
  blackperc = blackwinperc,

  wincolormap = d => d,
  wincolor = wincolormap,

  radius = 5, // (fixed) radius of the circles
  padding = 1, // (fixed) padding between the circles
  marginTop = 10, // top margin, in pixels
  marginRight = 20, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 20, // left margin, in pixels
  width = 1000, // outer width, in pixels
  height = 320, // outer height, in pixels
  xLabel = label, // a label for the x-axis
  xDomain = domain, // [xmin, xmax]
  xRange = [marginLeft, width - marginRight] // [left, right]
} = {}) {
  // Compute values.
  const X = d3.map(data, winrate);
  const T = opening == null ? null : d3.map(data, opening);
  const wW = d3.map(data, whiteperc);
  const wB = d3.map(data, blackperc);
  const wC = d3.map(data, wincolor)
  
  for (var i = 0; i<wW.length; i++)
    X[i] = Math.max(wW[i], wB[i])

  // Compute which data points are considered defined.
  const I = d3.range(X.length).filter(i => !isNaN(X[i]));

  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);

  // Construct scales and axes.
  const xScale = d3.scaleLinear(xDomain, xRange);
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);

  // Compute the y-positions.
  const Y = dodge(I.map(i => xScale(X[i])), radius * 2 + padding);
  // console.log(Y)


  // Compute the default height;
  if (height === undefined) height = (d3.max(Y, Math.abs) + radius + padding) * 2 + marginTop + marginBottom;

  // Given an array of x-values and a separation radius, returns an array of y-values.
  function dodge(X, radius) {
    const Y = new Float64Array(X.length);
    const radius2 = radius ** 2;
    const epsilon = 1e-3;
    let head = null, tail = null;
  
    // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
    function intersects(x, y) {
      let a = head;
      while (a) {
        const ai = a.index;
        if (radius2 - epsilon > (X[ai] - x) ** 2 + (Y[ai] - y) ** 2) return true;
        a = a.next;
      }
      return false;
    }
  
    // Place each circle sequentially.
    for (const bi of d3.range(X.length).sort((i, j) => X[i] - X[j])) {
  
      // Remove circles from the queue that can’t intersect the new circle b.
      while (head && X[head.index] < X[bi] - radius2) head = head.next;
  
      // Choose the minimum non-intersecting tangent.
      if (intersects(X[bi], Y[bi] = 0)) {
        let a = head;
        Y[bi] = Infinity;
        do {
          const ai = a.index;
          let y1 = Y[ai] + Math.sqrt(radius2 - (X[ai] - X[bi]) ** 2);
          let y2 = Y[ai] - Math.sqrt(radius2 - (X[ai] - X[bi]) ** 2);
          if (Math.abs(y1) < Math.abs(Y[bi]) && !intersects(X[bi], y1)) Y[bi] = y1;
          if (Math.abs(y2) < Math.abs(Y[bi]) && !intersects(X[bi], y2)) Y[bi] = y2;
          a = a.next;
        } while (a);
      }
  
      // Add b to the queue.
      const b = {index: bi, next: null};
      if (head === null) head = tail = b;
      else tail = tail.next = b;
    }
  
    return Y;
  }
        
  var svgWinrate = d3.select("#svganchor")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      // .attr("viewBox", [0, 0, width, height])
      // .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
      console.log("Got here")

  // Tooltip
  var tt = d3.select("#svganchor")
      .append("div")	
      .attr("class", "tooltip")				
      .style("opacity", 100);

  // Gray leader-line
  var xline = svgWinrate.append("line")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "1,2");
  
  svgWinrate.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call(g => g.append("text")
          .attr("x", marginLeft + width/2)
          .attr("y", marginBottom - 3)
          .attr("fill", "black")
          .attr("text-anchor", "end")
          .text(xLabel));

  const dot = svgWinrate.append("g")
    .selectAll("circle")
    .data(I)
    .join("circle")
      .attr("cx", i => xScale(X[i]))
      .attr("cy", i => (marginTop + height - marginBottom) / 2 + Y[i])
      .attr("r", radius)
      .attr("fill", d => wC[d])
  
  // Mouse hover
  d3.selectAll("circle")
    .on("mousemove", function(event, d) {
        tt.html("<strong>" + T[d]+ "</strong><br>" 
                  + wC[d] + "<br>"
                  + "Winrate: " + X[d] + " %")
            .style("top", (event.pageY - 12) + "px")
            .style("left", (event.pageX + 25) + "px")
            .style("opacity", 0.9);
          
          xline.attr("x1", d3.select(this).attr("cx"))
            .attr("y1", d3.select(this).attr("cy"))
            .attr("y2", (height - 30))
            .attr("x2",  d3.select(this).attr("cx"))
            .attr("opacity", 1);

      })
      .on("mouseout", function(d) {
        tt.style("opacity", 0);
        xline.attr("opacity", 0);
      });
      
  d3.selectAll(".button1").on("click", function(){
  draw(this.value)
  });

  return svgWinrate.node();
}

function originalBeeswarmChart(data, {
    label =  "Winrate", // convenience alias for xLabel
    domain, // convenience alias for xDomain
    
    value = d => d, // convience alias for x
    winrate = value, // given d in data, returns the quantitative x value
    
    openingname = d => d, // value for opening name
    opening = openingname, // given d in data, returns the title

    whitewinperc = d => d,
    whiteperc = whitewinperc,
    blackwinperc = d => d,
    blackperc = blackwinperc,

    radius = 5, // (fixed) radius of the circles
    padding = 1, // (fixed) padding between the circles
    marginTop = 10, // top margin, in pixels
    marginRight = 20, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 20, // left margin, in pixels
    width = 1000, // outer width, in pixels
    height = 320, // outer height, in pixels
    xLabel = label, // a label for the x-axis
    xDomain = domain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight] // [left, right]
} = {}) {
    // Compute values.
    const X = d3.map(data, winrate);
    const T = opening == null ? null : d3.map(data, opening);
    const wW = d3.map(data, whiteperc);
    const wB = d3.map(data, blackperc); 
    console.log("WTF BOOM")

    // Compute which data points are considered defined.
    const I = d3.range(X.length).filter(i => !isNaN(X[i]));
  
    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(X);
  
    // Construct scales and axes.
    const xScale = d3.scaleLinear(xDomain, xRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  
    // Compute the y-positions.
    const Y = dodge(I.map(i => xScale(X[i])), radius * 2 + padding);
    // console.log(Y)

  
    // Compute the default height;
    if (height === undefined) height = (d3.max(Y, Math.abs) + radius + padding) * 2 + marginTop + marginBottom;
  
    // Given an array of x-values and a separation radius, returns an array of y-values.
    function dodge(X, radius) {
      const Y = new Float64Array(X.length);
      const radius2 = radius ** 2;
      const epsilon = 1e-3;
      let head = null, tail = null;
    
      // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
      function intersects(x, y) {
        let a = head;
        while (a) {
          const ai = a.index;
          if (radius2 - epsilon > (X[ai] - x) ** 2 + (Y[ai] - y) ** 2) return true;
          a = a.next;
        }
        return false;
      }
    
      // Place each circle sequentially.
      for (const bi of d3.range(X.length).sort((i, j) => X[i] - X[j])) {
    
        // Remove circles from the queue that can’t intersect the new circle b.
        while (head && X[head.index] < X[bi] - radius2) head = head.next;
    
        // Choose the minimum non-intersecting tangent.
        if (intersects(X[bi], Y[bi] = 0)) {
          let a = head;
          Y[bi] = Infinity;
          do {
            const ai = a.index;
            let y1 = Y[ai] + Math.sqrt(radius2 - (X[ai] - X[bi]) ** 2);
            let y2 = Y[ai] - Math.sqrt(radius2 - (X[ai] - X[bi]) ** 2);
            if (Math.abs(y1) < Math.abs(Y[bi]) && !intersects(X[bi], y1)) Y[bi] = y1;
            if (Math.abs(y2) < Math.abs(Y[bi]) && !intersects(X[bi], y2)) Y[bi] = y2;
            a = a.next;
          } while (a);
        }
    
        // Add b to the queue.
        const b = {index: bi, next: null};
        if (head === null) head = tail = b;
        else tail = tail.next = b;
      }
    
      return Y;
    }
          
    var svgWinrate = d3.select("#svganchor")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        // .attr("viewBox", [0, 0, width, height])
        // .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
        console.log("Got here")
  
    // Tooltip
    var tt = d3.select("#svganchor")
        .append("div")	
				.attr("class", "tooltip")				
				.style("opacity", 100);

    // Gray leader-line
    var xline = svgWinrate.append("line")
				.attr("stroke", "gray")
				.attr("stroke-dasharray", "1,2");
    
    svgWinrate.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call(g => g.append("text")
            .attr("x", marginLeft + width/2)
            .attr("y", marginBottom - 4)
            .attr("fill", "black")
            .attr("text-anchor", "end")
            .text(xLabel));
  
    const dot = svgWinrate.append("g")
      .selectAll("circle")
      .data(I)
      .join("circle")
        .attr("cx", i => xScale(X[i]))
        .attr("cy", i => (marginTop + height - marginBottom) / 2 + Y[i])
        .attr("r", radius)
        .attr("fill", "red")
    
    // Mouse hover
    d3.selectAll("circle")
      .on("mousemove", function(event, d) {
          tt.html("<strong>" + T[d] + "</strong><br>" 
                    + "Winrate: " + X[d])
              .style("top", (event.pageY - 12) + "px")
              .style("left", (event.pageX + 25) + "px")
              .style("opacity", 0.9);
            
            xline.attr("x1", d3.select(this).attr("cx"))
              .attr("y1", d3.select(this).attr("cy"))
              .attr("y2", (height - 30))
              .attr("x2",  d3.select(this).attr("cx"))
              .attr("opacity", 1);

        })
        .on("mouseout", function(d) {
          tt.style("opacity", 0);
          xline.attr("opacity", 0);
        });
    d3.selectAll(".button1").on("click", function(){
        draw(this.value)
    });
  
    return svgWinrate.node();
  }

/*   
To Do:
  - Group openings in families DONE
  - Handle statistical significance of openings, especially with respect to elo
  - Elo range filter at least 200?
  - Hover over opening
  - Opening families should be coloured
  
*/