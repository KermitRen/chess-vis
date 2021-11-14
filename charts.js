document.addEventListener("DOMContentLoaded", pageLoaded());

let lichessData = [];
let openings = [];
let curr_aggregatedData = [];
var eloSlider;

function pageLoaded() {
    fetch("data/lichess.json")
    .then(response => response.json())
    .then(data => {lichessData = data})
    .then(_ => {setupSearchbar();setupSlider();reload()})
}

function setupSlider() {
    var slider = createD3RangeSlider(600, 3000, "#eloSlider");
    eloSlider = slider; 
    slider.onChange(function(range) {
        let rangeLabel = document.getElementById("currRange");
        rangeLabel.innerHTML = "Rating: " + range.begin + " - " + range.end;
    })
    slider.range(1000,2000);
    slider.onTouchEnd(function(){reload()});
}

async function setupSearchbar() {
    let openingNames = await getOpenings();
    openings = openingNames;
    let datalist = document.getElementById("openingNames");

    for(let i = 0; i < openingNames.length; i++) {
        let option = document.createElement("option");
        option.innerHTML = openingNames[i];
        datalist.appendChild(option);
    }
}

function gatherData() {
    let filteredData = applyFilters(lichessData);
    let aggregatedData = aggregateData(filteredData);
    curr_aggregatedData = aggregatedData;
    let aggregatedData2 = addPotentialVariations(aggregatedData);
    return removeInsignificantOpenings(aggregatedData2);
}

function reload() {
    cleanData = gatherData();
    drawCharts(cleanData);
}

//TODO
/*
- Adjust threshold function
- Clean up barchart
- Final chart for each opening?
- (Evt. clickable link til opening i chess.com/lichess)
*/

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
        //document.getElementById("openingName").href = "https://dr.dk";//ide med links
    }

    //Add Variations
    let aggregatedData = addPotentialVariations(curr_aggregatedData);
    let cleanData = removeInsignificantOpenings(aggregatedData);
    drawCharts(cleanData);

    //Stacked Bar Chart
    let chartContainer = document.getElementById("stackedBarChart");
    while (chartContainer.firstChild != null) {
      chartContainer.removeChild(chartContainer.lastChild);
    }

    if(document.getElementById("openingName").innerHTML != "") {
        variationsStackedBarChart(opening, {
            variations: d => d.name,
            whiteperc: d => 100*d.whiteWins/(d.whiteWins + d.blackWins + d.draws),
            blackperc: d => 100*d.blackWins/(d.whiteWins + d.blackWins + d.draws),
            drawperc: d => 100*d.draws/(d.whiteWins + d.blackWins + d.draws),
            chartContainerID: "stackedBarChart"
        });
    }
}

function removeInsignificantOpenings(data) {

    const threshold = 0.00005;
    let totalGames = countGames(data);

    return data.filter(opening => {
        let gameCount = opening.blackWins + opening.whiteWins + opening.draws;
        return gameCount/totalGames > threshold;
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

    return data.filter(game => timeControls.includes(game.TimeControl) && game.Rating > eloRange.begin && game.Rating < eloRange.end);
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
            let variation = opening.variations[i];
            variation.name = opening.name + ": " + variation.name;
            openingsE.push(variation);
        }
    }  

    return openingsE;
}

function aggregateData(data) {
    let openings = []

    for (let i = 0; i < data.length; i++) {
        let game = data[i];
        let opening = openings.find(x => x.name == game.Opening)
        if (opening) {
            whiteWin = game.Result == 0?1:0;
            blackWin = game.Result == 1?1:0;
            draw = game.Result == 2?1:0;
            opening.whiteWins += whiteWin;
            opening.blackWins += blackWin;
            opening.draws += draw;
            opening.gameLengthSum += game.noOfMoves;
            let existingVariation = opening.variations.find(x => x.name == game.Variation);
            if (existingVariation) {
                existingVariation.whiteWins += whiteWin;
                existingVariation.draws += draw;
                existingVariation.blackWins += blackWin;
                existingVariation.gameLengthSum += game.noOfMoves;
            } else {
                opening.variations.push({name: game.Variation, whiteWins: whiteWin, draws: draw, blackWins: blackWin, gameLengthSum: game.noOfMoves});
            } 
        } else {
            let whiteWin = game.Result == 0?1:0;
            let blackWin = game.Result == 1?1:0;
            let draw = game.Result == 2?1:0;
            let newOpening = {name: game.Opening,
                             whiteWins: whiteWin, 
                             blackWins: blackWin, 
                             draws: draw,
                             gameLengthSum: game.noOfMoves,
                             variations: [{name: game.Variation, whiteWins: whiteWin, draws: draw, blackWins: blackWin, gameLengthSum: game.noOfMoves}]};
            openings.push(newOpening);
        }
    }

    for (let i = 0; i < openings.length; i++) {
        openings[i]["avgGameLength"] = openings[i].gameLengthSum/(openings[i].whiteWins + openings[i].blackWins + openings[i].draws);
        delete openings[i].gameLengthSum;

        variations = openings[i].variations;
        for(let j = 0; j < variations.length; j++) {
            variations[j]["avgGameLength"] = variations[j].gameLengthSum/(variations[j].whiteWins + variations[j].blackWins + variations[j].draws);
            delete variations[j].gameLengthSum;
        }
    }
    return openings
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
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

async function getOpenings() {
    const response = await fetch("data/openings.json");
    let openings = await response.json();
    return openings;
}

function searchOpening() {
    let openingName = document.getElementById("openingSearchbar").value; 
    if(openings.includes(openingName)) {
        let opening = curr_aggregatedData.find(x => x.name == openingName);
        if(opening != null) {
            document.getElementById("openingSearchbar").value = "";
            showcaseOpening(opening);
        }
    }
}