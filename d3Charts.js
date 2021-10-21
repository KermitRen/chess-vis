function newBeeswarmChart(data, {
    
    winrate = d => d,
    opening = d => d, 
    whiteperc = d => d,
    blackperc = d => d,
    drawperc = d => d,
    wincolor = d => d,
  
    radius = 6, // (fixed) radius of the circles
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
    const X = d3.map(data, winrate);
    const T = opening == null ? null : d3.map(data, opening);
    const winWhite = d3.map(data, whiteperc);
    const winBlack = d3.map(data, blackperc);
    const Draw = d3.map(data, drawperc);
    const winColor = d3.map(data, wincolor)

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
        console.log("Got here")
  
    // Tooltip
    var tt = d3.select("#beeswarm1Container")
        .append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 100);
  
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
        .attr("text-anchor", "end")
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
                    + winColor[d] + "<br>"
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
        

  
    return svgWinrate.node();
  }