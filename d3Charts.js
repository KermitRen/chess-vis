
function variationsStackedBarChart(data, { 
  margin = {top: 25, right: 20, bottom: 10, left: 270},
  chartContainerID,
  variations = d => d,
  whiteperc = d => d,
  blackperc = d => d,
  drawperc = d => d,

} = {}) {
  const variationArray = data.variations;
  const varName = d3.map(variationArray, variations);
  const winWhite = d3.map(variationArray, whiteperc);
  const winBlack = d3.map(variationArray, blackperc);
  const winDraw = d3.map(variationArray, drawperc);

  //Calculate size
  width = document.getElementById(chartContainerID).getBoundingClientRect().width;
  height = document.getElementById(chartContainerID).getBoundingClientRect().height;

  //Create object to make it easy to stack
  variationsObject = []
  for(let i=0;i<variationArray.length;i++) {
    variationsObject.push({Variation: varName[i], White: winWhite[i], Draw: winDraw[i], Black: winBlack[i]})
  }

  console.log(variationsObject);

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

  console.log(variationsObject);

  //Slice variations to only show the 10 highest (on sorting)
  variationsObject = variationsObject.slice(0,10);
  var groups = variationsObject.map(v=>v.Variation);
  var subgroups = ["White", "Draw", "Black"];

  //Chart
  var svgBarChart = d3.select("#" + chartContainerID)
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
    .range(['White', 'Gray', 'Black']);//'#F6BD60','#F5CAC3','#84a59d'])
  
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
    .attr("x", d => x(d[0]) + 1)
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

  return svgBarChart.node();
}



function BeeswarmChart(data, {
  value = d => d, // convience alias for x
  color = d => d,
  outline = d => d,
  tooltip = d => d,
  containerID, 
  padding = 1.5, 
  marginTop = 10, 
  marginRight = 20, 
  marginBottom = 35, 
  marginLeft = 20, 
  width = document.getElementById(containerID).getBoundingClientRect().width,
  height = document.getElementById(containerID).getBoundingClientRect().height,
  radius = height/50,
  logScale = false,
  xLabel = "",
  chartHelp = "",
  valueUnit = ""} = {}) {

  // Compute values.
  const X = d3.map(data, value);
  const T = d3.map(data, tooltip);
  const C = d3.map(data, color);
  const O = d3.map(data, outline);
  
  // Compute which data points are considered defined.
  const I = d3.range(X.length).filter(i => !isNaN(X[i]));

  // Compute default domains.
  xDomain = d3.extent(X);
  xRange = [marginLeft, width - marginRight]

  // Construct scales and axes.
  const xScale = logScale ? d3.scaleLog(xDomain, xRange) : d3.scaleLinear(xDomain, xRange);
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);

  // Compute the y-positions.
  const Y = dodge(I.map(i => xScale(X[i])), radius * 2 + padding);

  // Create the canvas
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

  // Axis
  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis);

  // Label
  let chartContainer = document.getElementById(containerID);
  let chartTitleContainer = document.createElement("div");
  chartTitleContainer.className = "chartTitleContainer";

  let title = document.createElement("p");
  title.innerHTML = xLabel;

  let helpIcon = document.createElement("i");
  helpIcon.className = "material-icons";
  helpIcon.innerHTML = "help";
  helpIcon.onmouseenter = function () {
    let helpDiv = document.createElement("div")
    helpDiv.className = "tooltip";
    helpDiv.innerHTML = chartHelp;
    helpDiv.style.top = "100%";
    helpDiv.style.textAlign = "center";
    chartTitleContainer.appendChild(helpDiv);
  };
  helpIcon.onmouseleave = function () {
    chartTitleContainer.removeChild(chartTitleContainer.lastChild);
  }

  chartTitleContainer.appendChild(title);
  chartTitleContainer.appendChild(helpIcon);
  chartContainer.appendChild(chartTitleContainer);

  // Leader-line
  var xline = svg.append("line")
  .attr("stroke", "black")
  .attr("stroke-dasharray", "1,2");
  
  // Dots
  const dots = svg.append("g")
    .selectAll("circle")
    .data(I)
    .join("circle")
      .attr("cx", i => xScale(X[i]))
      .attr("cy", i => (marginTop + height - marginBottom) / 2 + Y[i])
      .attr("r", radius)
      .attr("fill", i => C[i])
      .attr("stroke", i => O[i])
      .style("cursor", "pointer");

  // Tooltip
  let tt = document.createElement("div");
  tt.style.opacity = "0";
  tt.className = "tooltip";
  chartContainer.appendChild(tt);

  // On hover
  dots.on("mousemove", function(event, i) {
    tt.style.top = (event.pageY - 12 - chartContainer.getBoundingClientRect().top) + "px";
    tt.style.left = (event.pageX + 25) + "px";
    tt.style.opacity = "0.95";
    tt.innerHTML = "<strong>" + T[i]+ "</strong><br>" + X[i].toFixed(2) + " " + valueUnit + "<br>"
    + "Based on " + numberWithCommas(data[i].blackWins+data[i].whiteWins+data[i].draws) + " games";

    xline.attr("x1", d3.select(this).attr("cx"))
      .attr("y1", d3.select(this).attr("cy"))
      .attr("y2", (height - 30))
      .attr("x2",  d3.select(this).attr("cx"))
      .attr("opacity", 1);
  })
  
  dots.on("mouseout", function() {
    tt.style.opacity = "0";
    xline.attr("opacity", 0);
  })

  //On click
  dots.on("click", function(_, i) {
    opening = data[i];
    showcaseOpening(opening);
  })

  // Show the graphic
  chartContainer.appendChild(svg.node());
}


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