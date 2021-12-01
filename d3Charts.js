function variationsStackedBarChart(data, sortBy = "") {

  //Variables
  var chartContainerID =  "svgContainer"
  let opening = data.find(x => x.name == document.getElementById("openingName").innerHTML);
  let variations = data.filter(opening => !opening.hasOwnProperty("variations"));
  let totalNoOfGames = variations.reduce((prev, curr) => prev + curr.whiteWins + curr.blackWins + curr.draws, 0);

  var width = document.getElementById(chartContainerID).getBoundingClientRect().width;
  var barHeight = document.getElementById(chartContainerID).getBoundingClientRect().height/12;
  var barGap = 3;
  var height = variations.length*(barHeight + barGap);

  //Reset Chart
  showLegend(false, data);

  let containerLeft = document.getElementById("variationLabelContainer");
  while(containerLeft.firstChild) {
    containerLeft.removeChild(containerLeft.lastChild);
  }

  let containerRight = document.getElementById("svgContainer");
  while(containerRight.firstChild) {
    containerRight.removeChild(containerRight.lastChild);
  }

  //Check if opening has games
  if(opening) {
    showLegend(true, data);
    document.getElementById("openingGameCounter").innerHTML = "Visualizing <strong>" + numberWithCommas(totalNoOfGames) + "</strong> Games";
  } else {
    document.getElementById("openingGameCounter").innerHTML = "";
    return;
  }

  //Map to data we want
  const N = d3.map(variations, v => v.name.slice(opening.name.length + 2));
  const G = d3.map(variations, v => v.whiteWins + v.blackWins + v.draws);
  const W = d3.map(variations, v => 100*v.whiteWins/(v.whiteWins + v.blackWins + v.draws));
  const B = d3.map(variations, v => 100*v.blackWins/(v.whiteWins + v.blackWins + v.draws));
  const D = d3.map(variations, v => 100*v.draws/(v.whiteWins + v.blackWins + v.draws));

  //Create object to make it easy to stack
  let variationBars = []
  for(let i = 0; i < variations.length; i++) {
    variationBars.push({name: N[i], games: G[i], white: W[i], draw: D[i], black: B[i]});
  }

  //Sort variations
  let sortingParameter = "";
  if(sortBy == "") {
    sortingParameter = opening.whiteWins > opening.blackWins ? "White" : "Black";
  } else {
    sortingParameter = sortBy;
  }
  variationBars = sortVariations(variationBars, sortingParameter);

  //Labels
  let labelContainer = document.getElementById("variationLabelContainer");
  for(let i = 0; i < variationBars.length; i++) {
    let variationInfoContainer = document.createElement("div");
    variationInfoContainer.style.height = barHeight + "px";
    variationInfoContainer.style.marginBottom = barGap + "px";

    variationInfoContainer.className = "variationInfo";

    let variationName = document.createElement("p");
    variationName.innerHTML = variationBars[i].name;
    variationName.className = "nameInfo";
    variationName.style.fontSize = (barHeight*0.8) + "px";
    variationInfoContainer.appendChild(variationName);

    let variationGames = document.createElement("p");
    variationGames.innerHTML = numberWithCommas(variationBars[i].games);
    variationGames.className = "gamesInfo";
    variationGames.style.fontSize = (barHeight*0.8) + "px";
    variationInfoContainer.appendChild(variationGames);

    labelContainer.appendChild(variationInfoContainer);
  }

  //Chart
  var svgBarChart = d3.select("#" + chartContainerID)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
  
  //x-axis
  x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);

  // color palette = one color per subgroup
  var color = d3.scaleOrdinal()
    .domain(["white", "draw", "black"])
    .range(['White', 'Gray', 'Black']);

  var labelColors = d3.scaleOrdinal()
    .domain(["white", "draw", "black"])
    .range(['Black', 'White', 'White']);
  
  //stack the data? --> stack per subgroup
  var stackedData = d3.stack()
   .keys(["white", "draw", "black"])
   (variationBars)

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
    .attr("y", (_, i) =>(i*(barHeight+barGap)))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("height", barHeight)
  
  // Make Labels
  svgBarChart.append("g")
  .selectAll("g")
  .data(stackedData)
  .enter().append("g")
    .style("fill", d => labelColors(d.key))
    .selectAll("text")
    .data(d => d)
    .enter().append("text")
    .style("font-size", (barHeight*0.65) + "px")
    .attr("class", "barLabel")
    .attr("x", d => (x(d[1])-x(d[0]))/2 + x(d[0]))
    .attr("y", (_, i) =>(i*(barHeight+barGap))+(barHeight*0.25))
    .attr("dy", ".75em")
    .text(d => {return (d[1]-d[0] > 15 ? Math.round(d[1]-d[0]) + "%" : "")});
  
  //Adjust for scrollbar
  let scrollableDiv = document.getElementById("stackedBarChart");
  if(scrollableDiv.scrollHeight > scrollableDiv.clientHeight) {
    document.getElementById("legendContainer").style.paddingRight = "10px";
  } else {
    document.getElementById("legendContainer").style.paddingRight = "0px";
  }

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
  border = 3,
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
      .attr("viewBox", [0, 0, width, height])

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

  //Brushing
  const brush = d3.brush()
      .on("start brush", brushed);

  brush.on("start", function() {removeOldSelections(containerID)});
  brush.on("end", deselect);

  svg.append("g")
  .attr("class", "brush")
  .call(brush)
  .call(g => g.select(".overlay").style("cursor", "default"));
  
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
      .style("stroke-width", 1.25)
      .attr("opacity", i => {
        let selectedOpening = document.getElementById("openingName").innerHTML;
        if(selectedOpening == "") {
          return 1;
        } else {
          return ((!data[i].hasOwnProperty('variations')) || data[i].name == selectedOpening) ? 1 : 0.2;
        }
      })
      .attr("pointer-events", "all")
      .style("cursor", "pointer");

  var lastSelection = [];  
  function brushed({selection}) {

    //Find indexes in selection
    let selectedIndexes = [];
    if (selection != null) {
      const [[x0, y0], [x1, y1]] = selection;
      selectedIndexes = I.filter( i => {
        let x = xScale(X[i]);
        let y = (marginTop + height - marginBottom) / 2 + Y[i];
        let selectedOpening = document.getElementById("openingName").innerHTML;
        if(selectedOpening == "") {
          return (x > x0 && x < x1 && y > y0 && y < y1);
        } else {
          return (((!data[i].hasOwnProperty('variations')) || data[i].name == selectedOpening) && x > x0 && x < x1 && y > y0 && y < y1);
        }
      })
    }
    
    //Highlight selection
    if(!equalArrays(lastSelection, selectedIndexes)) {
      let resetOpacity = (selectedIndexes.length > 0) ? false : true;
      for(let i = 0; i < 3; i++) {
        beeswarmContainerID = "beeswarm" + (i + 1) + "Container";

        let svg = d3.select("#" + beeswarmContainerID + " svg");
        if(document.getElementById("openingName").innerHTML == "") {
          svg.selectAll("circle")
          .attr("opacity", i => (resetOpacity || selectedIndexes.includes(i)) ? 1 : 0.2);
        } else {
          svg.selectAll("circle")
          .filter(function() {return d3.select(this).attr("stroke") != "None";})
          .attr("opacity", i => (resetOpacity || selectedIndexes.includes(i)) ? 1 : 0.2);
        }
      }
      lastSelection = selectedIndexes;
    }

  }

  var hadSelection = false
  function deselect({selection}) {
    brushed({selection});

    if(selection == null) {
      let currOpeningName = document.getElementById("openingName").innerHTML;
      if(currOpeningName != "" && !hadSelection) {
        let currOpening = data.find(x => x.name == currOpeningName);
        showcaseOpening(currOpening);
      }
      hadSelection = false;
    } else {
      hadSelection = true;
    }
  }

  //Highlight lines (1 for top beeplot, 2 for middle, 1 for bottom)
  svg.append('line')
    .attr("class", "line1")
    .style("stroke", "black")
    .style("stroke-width", 1);
  
  svg.append('line')
    .attr("class", "line2")
    .style("stroke", "black")
    .style("stroke-width", 1);
  
  svg.append('line')
    .attr("class", "line3")
    .style("stroke", "black")
    .style("stroke-width", 1);

  svg.append('line')
    .attr("class", "line4")
    .style("stroke", "black")
    .style("stroke-width", 1);

  // On hover Highlight
  dots.on("mouseover", function(event, i) {
    var topCircleCoordinates;
    var middleCircleCoordinates;
    var bottomCircleCoordinates;
    let bigRadius = height/30;
    let newOpacity = 1;
    for(let j = 0; j < 3; j++) {
      beeswarmContainerID = "beeswarm" + (j + 1) + "Container";
      let svg = d3.select("#" + beeswarmContainerID + " svg");
      hoveredCircle = svg.selectAll("circle")
        .filter(k => k === i)
        .attr("r", bigRadius)
        .raise()
        // .attr("fill", "orange");

      newOpacity = hoveredCircle.attr("opacity");
      //find coordinates for the 3 circles
      if(j == 0) {
        topCircleCoordinates = [hoveredCircle.attr("cx"),hoveredCircle.attr("cy")];
      } 
      if(j == 1) {
        middleCircleCoordinates = [hoveredCircle.attr("cx"),hoveredCircle.attr("cy")];
      }
      if(j == 2) {
        bottomCircleCoordinates = [hoveredCircle.attr("cx"),hoveredCircle.attr("cy")];   
      }
    }
    if(document.getElementById("connectToolCheckbox").checked) {
      for(let j = 0; j < 3; j++) {
        beeswarmContainerID = "beeswarm" + (j + 1) + "Container";
        let svg = d3.select("#" + beeswarmContainerID + " svg");
        if( j == 0 ) {
          svg.select(".line1")
            .attr("x1", topCircleCoordinates[0])
            .attr("y1", parseInt(topCircleCoordinates[1]))
            .attr("x2", middleCircleCoordinates[0])
            .attr("y2", border + parseInt(middleCircleCoordinates[1]) + height)
            .attr("opacity", newOpacity);
        }
        if( j == 1 ) {
          svg.select(".line2")
            .attr("x1", middleCircleCoordinates[0])
            .attr("y1", middleCircleCoordinates[1])
            .attr("x2", topCircleCoordinates[0])
            .attr("y2", border - (height-parseInt(topCircleCoordinates[1])))
            .attr("opacity", newOpacity);
          svg.select(".line3")
            .attr("x1", middleCircleCoordinates[0])
            .attr("y1", middleCircleCoordinates[1])
            .attr("x2", bottomCircleCoordinates[0])
            .attr("y2", border + parseInt(bottomCircleCoordinates[1]) + height)
            .attr("opacity", newOpacity);
        }
        if( j == 2 ) {
          svg.select(".line4")
            .attr("x1", bottomCircleCoordinates[0])
            .attr("y1", bottomCircleCoordinates[1])
            .attr("x2", middleCircleCoordinates[0])
            .attr("y2", border - (height-parseInt(middleCircleCoordinates[1])))
            .attr("opacity", newOpacity);
        }
      }
    }
  })

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
      .attr("y2", (height - marginBottom))
      .attr("x2",  d3.select(this).attr("cx"))
      .attr("opacity", 1);
  })
  
  dots.on("mouseout", function() {
    tt.style.opacity = "0";
    xline.attr("opacity", 0);
    for(let j = 0; j < 3; j++) {
      beeswarmContainerID = "beeswarm" + (j + 1) + "Container";
      let svg = d3.select("#" + beeswarmContainerID + " svg");
      svg.selectAll("circle").attr("r", radius);
      svg.selectAll("circle").attr("stroke", index => O[index]);
      svg.selectAll("circle").attr("fill", index => C[index])
      for(let k = 0; k < 4; k++){
        svg.select(".line"+(k+1))
          .attr("opacity", 0);
      }
    }
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

function removeOldSelections(containerID) {
  for(let i = 0; i < 3; i++) {
    id = "beeswarm" + (i + 1) + "Container";
    if(id != containerID) {
      let svg = d3.select("#" + id + " svg");
      svg.select(".brush").call(d3.brush().clear);
    }
  }
}

function equalArrays(array1, array2) {
  let length1 = array1.length;
  let length2 = array2.length;

  if(length1 != length2) {return false};
  if(length1 == 0) {return false};

  for(let i = 0; i < length1; i++) {
    if(array1[i] != array2[i]) {return false};
  }

  return true;
}

function sortVariations(variations, sortingParameter) {
  switch (sortingParameter) {
    case "Name": 
      return variations.sort(function(a, b) { return  a.name.localeCompare(b.name)});
    case "Count": 
      return variations.sort(function(a, b) { return b.games - a.games});
    case "White": 
      return variations.sort(function(a, b) { return b.white - a.white});
    case "Black": 
      return variations.sort(function(a, b) { return b.black - a.black});
    case "Draw": 
      return variations.sort(function(a, b) { return b.draw - a.draw});
  }
}

function showLegend(show, data) {

  // Elements
  let legend = document.getElementById("legendContainer");
  let hrs = document.getElementsByClassName("legendHR");

  if(show) {
    legend.style.display = "flex";
    for(let i = 0; i < hrs.length; i++) {
      hrs[i].style.display = "block";
    }

    document.getElementById("legendV").onclick = function() {variationsStackedBarChart(data, sortBy = "Name")};
    document.getElementById("legendG").onclick = function() {variationsStackedBarChart(data, sortBy = "Count")};
    document.getElementById("legendW").onclick = function() {variationsStackedBarChart(data, sortBy = "White")};
    document.getElementById("legendD").onclick = function() {variationsStackedBarChart(data, sortBy = "Draw")};
    document.getElementById("legendB").onclick = function() {variationsStackedBarChart(data, sortBy = "Black")};
  } else {
    legend.style.display = "none";
    for(let i = 0; i < hrs.length; i++) {
      hrs[i].style.display = "none";
    }
  }
}


function paracoordChart(data) {

  //Variables
  var chartContainerID =  "parallelCoordinatesChart";
  var chartContainer = document.getElementById(chartContainerID);
  let margin = {top: 10, right: 2, bottom: 30, left: 2};
  let opening = data.find(x => x.name == document.getElementById("openingName").innerHTML);
  let variations = data.filter(opening => !opening.hasOwnProperty("variations"));
  let totalNoOfGames = variations.reduce((prev, curr) => prev + curr.whiteWins + curr.blackWins + curr.draws, 0);

  var width = document.getElementById(chartContainerID).getBoundingClientRect().width;
  var height = document.getElementById(chartContainerID).getBoundingClientRect().height;
  let textsize = height/18;

  let parallelCoordinatesContainer = document.getElementById(chartContainerID);
  while (parallelCoordinatesContainer.firstChild) {
      parallelCoordinatesContainer.removeChild(parallelCoordinatesContainer.lastChild);
  }

  //Check if opening has games
  if(!opening || variations.length == 1) {return}

  //Map to data we want
  const N = d3.map(variations, v => v.name.slice(opening.name.length + 2));
  const P = d3.map(variations, v => (v.blackWins+v.whiteWins+v.draws)*100/totalNoOfGames);
  const W = d3.map(variations, v => Math.abs(100*((v.whiteWins - v.blackWins)/(v.blackWins+v.whiteWins+v.draws))));
  const C = d3.map(variations, v => (v.whiteWins - v.blackWins)/(v.blackWins+v.whiteWins+v.draws) > 0 ? "White" : "Black");
  const G = d3.map(variations, v => v.avgGameLength);

  //Create object to make it easy to stack
  let variationArray = []
  for(let i = 0; i < variations.length; i++) {
    variationArray.push({name: N[i], popularity: P[i], winrate: W[i], gamelength: G[i], color: C[i]});
  }

  let dimensions = ["winrate", "popularity", "gamelength"];
  let axisNames = {winrate: "Winrate", popularity: "Popularity", gamelength: "No of moves"}

  //Chart
  var svgParCoord= d3.select("#" + chartContainerID)
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  var y = {}
  y["winrate"] = d3.scaleLinear()
    .domain([0, variationArray.reduce(function(prev, curr) {return Math.max(prev, curr.winrate)},0)])
    .range([height - margin.bottom, margin.top + 10])

  y["popularity"] = d3.scaleLinear()
    .domain([0, variationArray.reduce(function(prev, curr) {return Math.max(prev, curr.popularity)},0)])
    .range([height - margin.bottom, margin.top + 10])

  y["gamelength"] = d3.scaleLinear()
    .domain(d3.extent(variationArray, d => d.gamelength))
    .range([height - margin.bottom, margin.top + 10])

  // Build the X scales
  x = d3.scalePoint()
    .range([0+margin.left + 1, width-margin.right - 1])
    .domain(dimensions);

  // Find Paths
  function path(d) {
      return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  let dynamicOpacity = variations.length < 10 ? 1 : (Math.pow(variations.length,-0.62)*4.33);

  // Draw the lines
  svgParCoord
    .selectAll("myPath")
    .data(variationArray)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke-width", 1.6)
    .style("stroke", d => d.color)
    .style("opacity", dynamicOpacity)

  // Tooltip
  let tt = document.createElement("div");
  tt.style.opacity = "0";
  tt.className = "tooltip";
  chartContainer.appendChild(tt);

    // On hover
  var paths = svgParCoord.selectAll("path");

  paths.on("mousemove", function(event, i) {
    tt.style.top = (event.pageY - 24 - document.getElementById("filters").getBoundingClientRect().bottom) + "px";
    tt.style.left = (event.pageX + 37 - chartContainer.getBoundingClientRect().left) + "px";
    tt.style.opacity = "0.95";
    d3.select(this).style("stroke-width", 3);
    d3.select(this).style("opacity", 1);
    d3.select(this).raise();
    tt.innerHTML = i.name;
  });

  paths.on("mouseout", function() {
    tt.style.opacity = "0";
    d3.select(this).style("stroke-width", 1.6);
    d3.select(this).style("opacity", dynamicOpacity);
  });

  let textAnchor = {winrate: "start", popularity: "middle", gamelength: "end"}
  var dragging = {};
  var line = d3.line();

  // Draw the axis:
  var g = svgParCoord.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    // Add axis title
    var labels = g.append("text")
      .style("text-anchor", d => textAnchor[d])
      .style("font-size", textsize + "px")
      .style("font-weight", "500")
      .style("cursor", "move")
      .attr("y", margin.top)
      .text(function(d) { return axisNames[d]; })
      .style("fill", "black");

    redirectAxis();
    
    g.call(d3.drag()
    .subject(function(d) { return {x: x(d)}; })
    .on("start", function(_, d) {
      dragging[d] = x(d);
    })
    .on("drag", function(event, d) {
      dragging[d] = Math.min(width - margin.right, Math.max(margin.left, event.x));
      paths.attr("d", path2);
      let oldDimensions = (dimensions[0], dimensions[1]);
      dimensions.sort(function(a, b) { return position(a) - position(b); });
      x.domain(dimensions);
      if((dimensions[0], dimensions[1]) != oldDimensions) { redirectAxis()};
      g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
    })
    .on("end", function(event, d) {
      delete dragging[d];
      transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
      transition(paths).attr("d", path2);
    }))

    function position(d) {
      var v = dragging[d];
      return v == null ? x(d) : v;
    }

    function path2(d) {
      return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
    }
    
    function transition(g) {
      return g.transition().duration(500);
    }

    function redirectAxis() {

      //Tickmark direction
      g.each(function(d) {
        if(dimensions[0] == d) {
          d3.select(this).call(d3.axisRight().scale(y[d]).ticks(5).tickSizeOuter(0));
          d3.select(this).selectAll(".tick").selectAll("text")
          .style("font-size", textsize + "px")
          .style("font-weight", "400")
          .style("text-anchor", "start")
        } else {
          d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(5).tickSizeOuter(0)); 
          d3.select(this).selectAll(".tick").selectAll("text")
          .style("font-size", textsize + "px")
          .style("font-weight", "400")
          .style("text-anchor", "end")
        }
      })

      //Label anchor
      labels.each(function (d) {
        if(dimensions[0] == d) {
          d3.select(this).style("text-anchor", "start");
        } else if(dimensions[1] == d){
          d3.select(this).style("text-anchor", "middle");
        } else {
          d3.select(this).style("text-anchor", "end");
        }
      })
    }

    svgParCoord.selectAll("g").selectAll("path")
    .attr("stroke-width", 1.2)

}