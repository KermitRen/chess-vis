function variationsStackedBarChart(data, { //data = en specific opening..?

  color_scheme_provider = d3.interpolateSpectral,
  margin = {top: 25, right: 20, bottom: 10, left: 230}, // change left margin to mess with text and barchart 
  width = document.getElementById("openingContainer").getBoundingClientRect().width,
  height = document.getElementById("openingContainer").getBoundingClientRect().height/2 +margin.top,
  opening = data.name,
  variations = d => d,
  whiteperc = d => d,
  blackperc = d => d,
  drawperc = d => d,

} = {}
) {
  const variationArray = data.variations;
  const varName = d3.map(variationArray, variations);
  const winWhite = d3.map(variationArray, whiteperc);
  const winBlack = d3.map(variationArray, blackperc);
  const winDraw = d3.map(variationArray, drawperc);
  const totalGames = data.whiteWins + data.blackWins + data.draws;
  //remove old chart
  chartContainer = document.getElementById("openingContainer");
        while (chartContainer.firstChild != null) {
            chartContainer.removeChild(chartContainer.lastChild);
        }


  //Create object to make it easy to stack
  variationsObject = []
  for(let i=0;i<variationArray.length;i++) {
    variationsObject.push({Variation: varName[i], White: winWhite[i], Draw: winDraw[i], Black: winBlack[i]})
  }
  const noVariation = variationsObject.find(x=>x.Variation=="No variation");
  const areNoGamesInNoVariation = isNaN(noVariation.White);
  if (areNoGamesInNoVariation) {
    variationsObject.splice(0,1)
  }
  //Sort variations
  variationsObject = sortVariationData(variationsObject, "White")
  function sortVariationData(variationsObject, sortingParameter) {
    switch (sortingParameter) {
      case "White": 
        variationsObject.sort(function(a, b) { return b.White - a.White});
        return variationsObject
      case "Black": 
        variationsObject.sort(function(a, b) { return b.Black - a.Black});
        return variationsObject
      case "Draw": 
        variationsObject.sort(function(a, b) { return b.Draw - a.Draw});
        return variationsObject
    }
  }
  //Slice variations to only show the 12 highest (on sorting)
  variationsObject = variationsObject.slice(0,10);
  var groups = variationsObject.map(v=>v.Variation);
  var subgroups = ["White", "Draw", "Black"];

  //Name of the opening
  const title = d3.select("#openingContainer")
    .append("text")
    .attr("x",-40)             
    .attr("y", 0)
    .attr("text-anchor", "end")  
    .style("font-size", "30px") 
    .text(opening);
  
  //Chart
  var svgBarChart = d3.select("#openingContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
  
  //x-axis
  x = d3.scaleLinear()
  .domain([0, 100])
  .range([margin.left, width - margin.right])
  svgBarChart.append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x).ticks(3));
    
  //y-axis
  y = d3.scaleBand()
  .domain(groups)
  .range([margin.top, margin.top + (25*groups.length)]) //(height - margin.bottom)
  .padding(0.1);
  svgBarChart.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    //.style("font", "25px Roboto")
    .attr('fill', 'black')
    .style("fill", "#999999")
    .call(d3.axisLeft(y).tickSizeOuter(0));

  // color palette = one color per subgroup
  var color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#F6BD60','#F5CAC3','#84a59d'])
  
  //stack the data? --> stack per subgroup
  var stackedData = d3.stack()
   .keys(subgroups)
   (variationsObject)

  // Show the bars
  svgBarChart.append("g")
  .selectAll("g")
  // Enter in the stack data = loop key per key = group per group
  .data(stackedData)
  .enter().append("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    // enter a second time = loop subgroup per subgroup to add all rectangles
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", (d, i) => y(d.data.Variation))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("height", 22)//y.bandwidth())
    // .append("text")
    // .attr("class","label")
    // .attr("x", (function(d) { return x(d.date); }  ))
    // .attr("y", function(d) { return y(d.value) - 20; })
    // .attr("dy", ".75em")
    // .text(d => d[1]);


  // //Add labels to bars
  // svgBarChart.selectAll(".text")        
  // .data(stackedData)
  // .enter()
  // .append("text")
  // .attr("class","label")
  // .attr("x", (function(d) { return x(d.date); }  ))
  // .attr("y", function(d) { return y(d.value) - 20; })
  // .attr("dy", ".75em")
  // .text(function(d) { return d.value; });

  //Add text on how many games vizualized
  const totalGamesVisualized = d3.select("#openingContainer")
    .append("text")
    .attr("x",-40)             
    .attr("y", 0)
    .attr("text-anchor", "end")  
    .style("font-size", "30px") 
    .text("Visualized on " + totalGames.toLocaleString('en-US') + " games");

  return svgBarChart.node();
}

function newBeeswarmChart(data, {
    
    winrate = d => d,
    opening = d => d, 
    // whiteperc = d => d,
    // blackperc = d => d,
    // drawperc = d => d,
    wincolor = d => d,
    noOfGames = d => d, 
  
    radius = document.getElementById('beeswarm1Container').clientHeight / 50, //radius of the circles, needs to depend on width also
    padding = 1, // (fixed) padding between the circles
    marginTop = 10, // top margin, in pixels
    marginRight = 20, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 20, // left margin, in pixels
    width = 1000, // outer width, in pixels
    height = 320, // outer height, in pixels
    xLabel = "", // a label for the x-axis
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight] // [left, right]
    } = {}
    ) {

    // Compute values.
    const totalGamesArray = d3.map(data, noOfGames);
    const totalGames = totalGamesArray.reduce(summing,0);
    const X = d3.map(data, winrate);
    const T = opening == null ? null : d3.map(data, opening);
    // const winWhite = d3.map(data, whiteperc);
    // const winBlack = d3.map(data, blackperc);
    // const winDraw = d3.map(data, drawperc);
    const winColor = d3.map(data, wincolor)

    //Reduce-function that sums all games
    function summing(previousValue, currentValue) { 
      return previousValue + currentValue;
    }

    // Compute which data points are considered defined.
    const I = d3.range(X.length).filter(i => !isNaN(X[i]));
  
    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(X);
  
    // Construct scales and axes.
    const xScale = d3.scaleLinear(xDomain, xRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  
    // Compute the y-positions.
    const Y = dodge(I.map(i => xScale(X[i])), radius * 2 + padding);
  
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
          
    var svgWinrate = d3.select("#beeswarm1Container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        // .attr("viewBox", [0, 0, width, height])
        // .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    // Tooltip
    var tt = d3.select("#beeswarm1Container")
        .append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
  
    // Leader-line
    var xline = svgWinrate.append("line")
        .attr("stroke", "black")
        .attr("stroke-dasharray", "1,2");
    
    svgWinrate.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
    
    svgWinrate.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(g => g.append("text")
        .attr("x", marginLeft + width/2)
        .attr("y", marginTop + 20)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(xLabel));
  
    const dot = svgWinrate.append("g")
      .selectAll("circle")
      .data(I)
      .join("circle")
        .attr("cx", i => xScale(X[i]))
        .attr("cy", i => (marginTop + height - marginBottom) / 2 + Y[i])
        .attr("r", radius)
        .attr("fill", d => winColor[d])
    
    svgWinrate.append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(g => g.append("text")
      .attr("x", width-marginRight)
      .attr("y", marginTop)
      .attr("fill", "black")
      .attr("text-anchor", "end")
      .text("Visualized on " + totalGames.toLocaleString('en-US') + " games"));

    // Mouse hover
    dot.on("mousemove", function(event, d) {
          tt.html("<strong>" + T[d]+ "</strong><br>" 
                    + X[d].toFixed(2) + " %<br>"
                    + "Total games: " + totalGamesArray[d])
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
    // Mouse click
    dot.on("click", function(event, d) {
      const openingClicked = T[d];
      openingObject = data.find( v => v.name == openingClicked)
      variationsStackedBarChart(openingObject, {
        variations: d => d.Variation,
        whiteperc: d => 100*d.TotalWhiteWins/(d.VarSum),
        blackperc: d => 100*d.TotalBlackWins/(d.VarSum),
        drawperc: d => 100*d.TotalDraws/(d.VarSum)
      })
    })    

  
    return svgWinrate.node();
  }

  function gameLengthBeeswarmChart(data, {
    
    gameLength = d => d,
    opening = d => d, 
    wincolor = d => d,
    noOfGames = d => d, 
  
    radius = document.getElementById('beeswarm2Container').clientHeight / 50, //radius of the circles, needs to depend on width also
    padding = 1, // (fixed) padding between the circles
    marginTop = 10, // top margin, in pixels
    marginRight = 20, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 20, // left margin, in pixels
    width = 1000, // outer width, in pixels
    height = 320, // outer height, in pixels
    xLabel = "", // a label for the x-axis
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight] // [left, right]
    } = {}
    ) {

    // Compute values.
    const gameLengthArray = d3.map(data, gameLength);
    const totalGamesArray = d3.map(data, noOfGames);
    const totalGames = totalGamesArray.reduce(summing,0);
    const X = d3.map(data, gameLength);
    const T = opening == null ? null : d3.map(data, opening);
    // const winWhite = d3.map(data, whiteperc);
    // const winBlack = d3.map(data, blackperc);
    // const winDraw = d3.map(data, drawperc);
    const winColor = d3.map(data, wincolor)

    //Reduce-function that sums all games
    function summing(previousValue, currentValue) { 
      return previousValue + currentValue;
    }

    // Compute which data points are considered defined.
    const I = d3.range(X.length).filter(i => !isNaN(X[i]));
  
    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(X);
  
    // Construct scales and axes.
    const xScale = d3.scaleLinear(xDomain, xRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  
    // Compute the y-positions.
    const Y = dodge(I.map(i => xScale(X[i])), radius * 2 + padding);
  
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
          
    var svgGameLength = d3.select("#beeswarm2Container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        // .attr("viewBox", [0, 0, width, height])
        // .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    // Tooltip
    var tt = d3.select("#beeswarm2Container")
        .append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
  
    // Leader-line
    var xline = svgGameLength.append("line")
        .attr("stroke", "black")
        .attr("stroke-dasharray", "1,2");
    
    svgGameLength.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
    
    svgGameLength.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(g => g.append("text")
        .attr("x", marginLeft + width/2)
        .attr("y", marginTop + 20)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(xLabel));
  
    const dot = svgGameLength.append("g")
      .selectAll("circle")
      .data(I)
      .join("circle")
        .attr("cx", i => xScale(X[i]))
        .attr("cy", i => (marginTop + height - marginBottom) / 2 + Y[i])
        .attr("r", radius)
        .attr("fill", d => winColor[d])

    // Mouse hover
    dot.on("mousemove", function(event, d) {
          tt.html("<strong>" + T[d]+ "</strong><br>" 
                    + "Avg. moves: " + X[d].toFixed(2) + "<br>"
                    + "Total games: " + totalGamesArray[d])
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
        

  
    return svgGameLength.node();
  }
  function popularityBeeswarmChart(data, {
    
    winrate = d => d,
    opening = d => d, 
    // whiteperc = d => d,
    // blackperc = d => d,
    // drawperc = d => d,
    wincolor = d => d,
    noOfGames = d => d, 
  
    radius = document.getElementById('beeswarm3Container').clientHeight / 50, //radius of the circles, needs to depend on width also
    padding = 1, // (fixed) padding between the circles
    marginTop = 10, // top margin, in pixels
    marginRight = 20, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 20, // left margin, in pixels
    width = 1000, // outer width, in pixels
    height = 320, // outer height, in pixels
    xLabel = "", // a label for the x-axis
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight] // [left, right]
    } = {}
    ) {

    // Compute values.
    const totalGamesArray = d3.map(data, noOfGames);
    const totalGames = totalGamesArray.reduce(summing,0);
    const popularity = totalGamesArray.map(x => 100*x/totalGames);
    const X = popularity;
    const T = opening == null ? null : d3.map(data, opening);
    // const winWhite = d3.map(data, whiteperc);
    // const winBlack = d3.map(data, blackperc);
    // const winDraw = d3.map(data, drawperc);
    const winColor = d3.map(data, wincolor)

    //Reduce-function that sums all games
    function summing(previousValue, currentValue) { 
      return previousValue + currentValue;
    }

    // Compute which data points are considered defined.
    const I = d3.range(X.length).filter(i => !isNaN(X[i]));
  
    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(X);
  
    // Construct scales and axes.
    const xScale = d3.scaleLog(xDomain, xRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  
    // Compute the y-positions.
    const Y = dodge(I.map(i => xScale(X[i])), radius * 2 + padding);
  
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
          
    var svgWinrate = d3.select("#beeswarm3Container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        // .attr("viewBox", [0, 0, width, height])
        // .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    // Tooltip
    var tt = d3.select("#beeswarm3Container")
        .append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
  
    // Leader-line
    var xline = svgWinrate.append("line")
        .attr("stroke", "black")
        .attr("stroke-dasharray", "1,2");
    
    svgWinrate.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
    
    svgWinrate.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(g => g.append("text")
        .attr("x", marginLeft + width/2)
        .attr("y", marginTop + 20)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(xLabel));
  
    const dot = svgWinrate.append("g")
      .selectAll("circle")
      .data(I)
      .join("circle")
        .attr("cx", i => xScale(X[i]))
        .attr("cy", i => (marginTop + height - marginBottom) / 2 + Y[i])
        .attr("r", radius)
        .attr("fill", d => winColor[d])

    // Mouse hover
    dot.on("mousemove", function(event, d) {
          tt.html("<strong>" + T[d]+ "</strong><br>" 
                    + X[d].toFixed(2) + " %<br>"
                    + "Total games: " + totalGamesArray[d])
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
        

  
    return svgWinrate.node();
  }