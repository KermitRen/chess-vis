function variationsStackedBarChart(data, { //data = en specific opening..?

    color_scheme_provider = d3.interpolateSpectral,
    margin = {top: 20, right: 20, bottom: 10, left: 50},
    width = document.getElementById("stackedBarChart").getBoundingClientRect().width,
    height = (data.length * 25) + margin.top + margin.bottom,
    //height = data.length * 150 + margin.top + margin.bottom
    //margin = ({top: 30, right: 30, bottom: 0, left: 190})
    opening = data.name,
    variations = d => d,
    whiteperc = d => d,
    blackperc = d => d,
    drawperc = d => d,

  } = {}
  ) {
    console.log("Opening: "+ opening);
    const variationArray = data.variations;
    console.log(variationArray)
    const varName = d3.map(variationArray, variations);
    console.log(varName)
    const winWhite = d3.map(variationArray, whiteperc);
    const winBlack = d3.map(variationArray, blackperc);
    const winDraw = d3.map(variationArray, drawperc);
    console.log(winWhite)
    console.log(winBlack)
    console.log(winDraw)
    for(let i=0;i<variationArray.length;i++) {
      
    }

    //values
    series = d3.stack()
        (winWhite)
    console.log(series)
    //x-axis
    x = d3.scaleLinear()
    .domain([0, 100])
    .range([margin.left, width - margin.right])
    
    //y-axis
    y = d3.scaleBand()
    .domain(variationArray.map(d => d.Variation))
    .range([margin.top, height - margin.bottom])
    .padding(0.1)
    
    //Colors
    color = d3.scaleOrdinal()
      .domain(series.map(d => d.key))
      .range(["#0571b0", "#ca0020"])
    
    //draw x-axis?
    xAxis = g => g
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x).ticks(width / 100, "s"))
    .call(g => g.selectAll(".domain").remove())
    
    //draw y-axis
    yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call(g => g.selectAll(".domain").remove())


    //Chart
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);
  
    svg.append("g")
      .selectAll("g")
      .data(series)
      .join("g")
        .attr("fill", d => color(d.key))
        .attr("stroke", "white")
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        .attr("x", d => x(d[0]))
        .attr("y", (d, i) => y(d.data.title))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth())
      .append("title")
        .text(d => `${d.data.title} ${d.key}
          ${formatValue(d.data[d.key])}`);
    
      svg.append("g")
          .style("font", "25px Roboto")
          .call(xAxis);
    
      svg.append("g")
          .style("font", "25px Roboto")
          .call(yAxis);


    return null//svgWinrate.node();
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