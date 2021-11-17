document.addEventListener("DOMContentLoaded", pageLoaded());

let lichessData = [];
let openings = {};
let curr_aggregatedData = [];
var eloSlider;

function pageLoaded() {
    fetch("data/lichess_.json")
    .then(response => response.json())
    .then(data => {lichessData = data})
    .then(_ => {setupSearchbar();setupSlider();reload()})
}

function setupSlider() {

    //Setup Slider
    var slider = createD3RangeSlider(600, 3000, "#eloSlider");
    eloSlider = slider; 
    slider.onChange(function(range) {
        let rangeLabel = document.getElementById("currRange");
        rangeLabel.innerHTML = "Rating: " + range.begin + " - " + range.end;
    })
    slider.range(1000,2000);
    slider.onTouchEnd(function(){reload()});

    //Add Tickmarks
    let labeledMarks = [600, 1000, 1500, 2000, 2500, 3000];
    let markContainer = document.getElementById("ticks");
    for(let i = 600; i <= 3000; i += 50) {

        let makeLabel = labeledMarks.includes(i);

        let tickmark = document.createElement("div");
        tickmark.className = "tickmark";
        tickmark.style.height = makeLabel ? "6px" : "3px";
        markContainer.appendChild(tickmark);

        if(makeLabel) {
            let label = document.createElement("p");
            label.innerHTML = i;
            tickmark.appendChild(label);
        }

    }
}

async function setupSearchbar() {

    const response = await fetch("data/openingsMap.json");
    openings = await response.json();

    let openingNames = Object.keys(openings);
    let datalist = document.getElementById("openingNames");

    for(let i = 0; i < openingNames.length; i++) {
        let option = document.createElement("option");
        option.innerHTML = openingNames[i];
        datalist.appendChild(option);
    }
}

function gatherData() {
    let lichessDataCopy = JSON.parse(JSON.stringify(lichessData)); //Could perhaps be optimized
    let filteredData = applyFilters(lichessDataCopy);
    curr_aggregatedData = filteredData;
    let aggregatedData2 = addPotentialVariations(filteredData);
    return removeInsignificantOpenings(aggregatedData2);
}

function reload() {
    cleanData = gatherData();
    drawCharts(cleanData);
}

//TODO
/*
- Final chart for each opening?
- Clean up barchart  også threshhold
- ledger til bar chart, plus sorteringsfunktion
- sorter barchart efter farven på den circle man klikker på
- transitions?
- deselect by cliking nothing
- Fix: too long leaderline
- Fix: Slider escaping from mouse
*/

//Special TODO:
// Setup github pages

function drawCharts(cleanData) {

    //Remove all charts
    for (let i=0; i<3;i++) {
        chartContainer = document.getElementById("beeswarm"+(i+1)+"Container");
        while (chartContainer.firstChild != null) {
            chartContainer.removeChild(chartContainer.lastChild);
        }
    }

    //Game count
    gameCount = countGames(cleanData);
    document.getElementById("gameCounter").innerHTML = "Visualizing <strong>" + numberWithCommas(gameCount) + "</strong> Games";

    //Winrate Chart
    BeeswarmChart(cleanData, {
        value: d => Math.abs(100*((d.whiteWins - d.blackWins)/(d.blackWins+d.whiteWins+d.draws))), 
        tooltip: d => d.name,
        color: coloringPoints,
        outline: outliningPoints,
        containerID: "beeswarm1Container",
        xLabel: "Winrate",
        chartHelp: "This chart shows the percentage one color wins more than the other. <br>" +
                   "A white dot at 50%, means that white wins 50% more than black for this opening",
        valueUnit: "%"
    })

    //Popularity Chart
    BeeswarmChart(cleanData, {
        value: d => (d.blackWins+d.whiteWins+d.draws)*100/gameCount, 
        tooltip: d => d.name,
        color: coloringPoints,
        outline: outliningPoints,
        containerID: "beeswarm2Container",
        xLabel: "Popularity",
        chartHelp: "This chart shows what percentage of games correponds to each opening on a logarithmic scale",
        valueUnit: "% of games",
        logScale: true
    })

    //Gamelength Chart
    BeeswarmChart(cleanData, {
        value: d => d.avgGameLength, 
        tooltip: d => d.name,
        color: coloringPoints,
        outline: outliningPoints,
        containerID: "beeswarm3Container",
        xLabel: "Average Gamelength",
        chartHelp: "This chart shows what the average number of moves is for each opening",
        valueUnit: "Moves"
    })

    //Stacked Bar Chart
    let stackedBarchartContainer = document.getElementById("stackedBarChart");
    while (stackedBarchartContainer.firstChild != null) {
        stackedBarchartContainer.removeChild(stackedBarchartContainer.lastChild);
    }

    if(document.getElementById("openingName").innerHTML != "") {
        let opening = cleanData.find(x => x.name == document.getElementById("openingName").innerHTML);
        if(opening) {
            variationsStackedBarChart(opening, {
                variations: d => d.name,
                whiteperc: d => 100*d.whiteWins/(d.whiteWins + d.blackWins + d.draws),
                blackperc: d => 100*d.blackWins/(d.whiteWins + d.blackWins + d.draws),
                drawperc: d => 100*d.draws/(d.whiteWins + d.blackWins + d.draws),
                chartContainerID: "stackedBarChart"
            });
        }
    }
}

function showcaseOpening(opening) {

    //Abort if variation
    if(!opening.hasOwnProperty('variations')) {
        return;
    }

    //Set Name
    let selectedOpening = document.getElementById("openingName").innerHTML;
    if(selectedOpening == opening.name) {
        document.getElementById("openingName").innerHTML = "";
    } else {
        document.getElementById("openingName").innerHTML = opening.name;
        document.getElementById("openingName").href = openings[opening.name];
    }

    //Add Variations
    let aggregatedData = addPotentialVariations(curr_aggregatedData);
    let cleanData = removeInsignificantOpenings(aggregatedData);
    drawCharts(cleanData);
}

function removeInsignificantOpenings(data) {

    const threshold = 15;

    return data.filter(opening => {
        let gameCount = opening.blackWins + opening.whiteWins + opening.draws;
        return gameCount > threshold;
    })
}

function applyFilters(data) {

    //Elo Filter
    let eloRange = eloSlider.range(null,null);

    //Time Control Filter
    let timeControls = [];
    if(document.getElementById("bulletCheckbox").checked) {timeControls.push(1)};
    if(document.getElementById("blitzCheckbox").checked) {timeControls.push(2)};
    if(document.getElementById("rapidCheckbox").checked) {timeControls.push(3)};
    if(document.getElementById("classicalCheckbox").checked) {timeControls.push(4)};

    //Combine Filters
    let openings = [];

    for(let time = 1; time <= 4; time++) {
        if(timeControls.includes(time)) {
            for(let elo = eloRange.begin; elo < eloRange.end; elo += 50) {
                let filterString = "rating_" + elo + "_time_" + time;
                let filterData = data[filterString];

                for(let i = 0; i < filterData.length; i++) {
                    let curr_opening = filterData[i];
                    let opening = openings.find(x => x.name == curr_opening.name);
                    if(opening) {
                        let noOfOldGames = (opening.whiteWins+opening.blackWins+opening.draws);
                        opening.whiteWins += curr_opening.whiteWins;
                        opening.blackWins += curr_opening.blackWins;
                        opening.draws += curr_opening.draws;
                        let noOfNewGames = (opening.whiteWins+opening.blackWins+opening.draws);
                        opening.avgGameLength = (noOfOldGames/noOfNewGames)*opening.avgGameLength + (1-(noOfOldGames/noOfNewGames))*curr_opening.avgGameLength;
                        
                        let curr_variations = curr_opening.variations;
                        for(let j = 0; j <curr_variations.length; j++) {
                            let variation = opening.variations.find(x => x.name == curr_variations[j].name);
                            if(variation) {
                                let noOfOldGames = (variation.whiteWins+variation.blackWins+variation.draws);
                                variation.whiteWins += curr_variations[j].whiteWins;
                                variation.blackWins += curr_variations[j].blackWins;
                                variation.draws += curr_variations[j].draws;
                                let noOfNewGames = (variation.whiteWins+variation.blackWins+variation.draws);
                                variation.avgGameLength = (noOfOldGames/noOfNewGames)*variation.avgGameLength + (1-(noOfOldGames/noOfNewGames))*curr_variations[j].avgGameLength;
                            } else {
                                opening.variations.push(curr_variations[j]);
                            }
                        }
                    } else {    
                        openings.push(filterData[i]);
                    }
                }
                
            }
        }
    }
    return openings;
}

function addPotentialVariations(data) {

    //Find currently selected opening
    let openingName = document.getElementById("openingName").innerHTML;
    if(openingName == "") {return data}

    //Add Variations
    let openingsE = JSON.parse(JSON.stringify(data));
    let opening = openingsE.find(opening => opening.name == openingName);
    if(opening) {
        for(let i = 0; i < opening.variations.length; i++) {
            let variation = JSON.parse(JSON.stringify(opening.variations[i]));
            variation.name = opening.name + ": " + variation.name;
            openingsE.push(variation);
        }
    }  

    return openingsE;
}

function countGames(openings) {
    return openings.reduce((prev, curr) => {
        if(curr.hasOwnProperty('variations')) {
            return prev + curr.whiteWins + curr.blackWins + curr.draws;
        } else {
            return prev;
        }
    }, 0)
}

function coloringPoints(opening) {
    let gamesPlayed = opening.whiteWins + opening.blackWins + opening.draws;
    let whiteWinrate = opening.whiteWins/gamesPlayed;
    let blackWinrate = opening.blackWins/gamesPlayed;
    return whiteWinrate>blackWinrate ? "White" : "Black";
}

function outliningPoints(opening) {
    
    //Find selected opening
    let selectedOpening = document.getElementById("openingName").innerHTML;
    if(selectedOpening == "") { return "None"};

    //Find correct outline
    if(!opening.hasOwnProperty('variations')) {
        return "Blue"
    } else {
        return opening.name == selectedOpening? "Red" : "None";
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

function searchOpening() {
    let openingName = document.getElementById("openingSearchbar").value; 
    if(openings.hasOwnProperty(openingName)) {
        let opening = curr_aggregatedData.find(x => x.name == openingName);
        if(opening != null) {
            document.getElementById("openingSearchbar").value = "";
            showcaseOpening(opening);
        }
    }
}