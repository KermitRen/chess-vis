document.addEventListener("DOMContentLoaded", pageLoaded());

let lichessData = []; 

function pageLoaded() {
    fetch("data/lichess.json")
    .then(response => response.json())
    .then(data => {lichessData = data})
    .then(_ => {setupPage(); drawCharts()})
}

function setupPage() {

}

function drawCharts() {

    //Collect data
    let filteredData = applyFilters(lichessData);
    let aggregatedData = aggregateData(filteredData);
    let cleanAggregatedData = removeInsignificantOpenings(aggregatedData);
    console.log(cleanAggregatedData.length)
    console.log(cleanAggregatedData)

    //Remove all charts
    for (let i=0; i<3;i++) {
        chartContainer = document.getElementById("beeswarm"+(i+1)+"Container");
        while (chartContainer.firstChild != null) {
            chartContainer.removeChild(chartContainer.lastChild);
        }
    }

    // minElo = 600;
    // maxElo = 3000;

    //Draw chart
    newBeeswarmChart(cleanAggregatedData, { 
        winrate: d => Math.abs(100*((d.whiteWins - d.blackWins)/(d.blackWins+d.whiteWins+d.draws))), 
        opening: d => d.name,
        // whiteperc: d => 100*d.whiteWins/(d.whiteWins + d.blackWins + d.draws),
        // blackperc: d => 100*d.blackWins/(d.whiteWins + d.blackWins + d.draws),
        // drawperc: d => 100*d.draws/(d.whiteWins + d.blackWins + d.draws),
        wincolor: d => (d.whiteWins/(d.whiteWins + d.blackWins + d.draws)>(d.blackWins/(d.whiteWins + d.blackWins + d.draws)))?"White":"Black",
        noOfGames: d => d.whiteWins + d.blackWins + d.draws,
        xLabel: "% Winrate", //find better wording, "more/increased/greater % winrate" or similar
        width: document.getElementById("beeswarm1Container").getBoundingClientRect().width,
        height: document.getElementById("beeswarm1Container").getBoundingClientRect().height
    });

    gameLengthBeeswarmChart(cleanAggregatedData, { 
        gameLength: d => d.avgGameLength, 
        opening: d => d.name,
        // whiteperc: d => 100*d.whiteWins/(d.whiteWins + d.blackWins + d.draws),
        // blackperc: d => 100*d.blackWins/(d.whiteWins + d.blackWins + d.draws),
        // drawperc: d => 100*d.draws/(d.whiteWins + d.blackWins + d.draws),
        wincolor: d => (d.whiteWins/(d.whiteWins + d.blackWins + d.draws)>(d.blackWins/(d.whiteWins + d.blackWins + d.draws)))?"White":"Black",
        noOfGames: d => d.whiteWins + d.blackWins + d.draws,
        xLabel: "Game length", //find better wording, "more/increased/greater % winrate" or similar
        width: document.getElementById("beeswarm2Container").getBoundingClientRect().width,
        height: document.getElementById("beeswarm2Container").getBoundingClientRect().height
    });

    popularityBeeswarmChart(cleanAggregatedData, { 
        gameLength: d => d.avgGameLength, 
        opening: d => d.name,
        wincolor: d => (d.whiteWins/(d.whiteWins + d.blackWins + d.draws)>(d.blackWins/(d.whiteWins + d.blackWins + d.draws)))?"White":"Black",
        noOfGames: d => d.whiteWins + d.blackWins + d.draws,
        xLabel: "Game popularity on a log scale in %", //find better wording, "more/increased/greater % winrate" or similar
        width: document.getElementById("beeswarm3Container").getBoundingClientRect().width,
        height: document.getElementById("beeswarm3Container").getBoundingClientRect().height
    });
}

function removeInsignificantOpenings(data) {

    const threshold = 0.00005;
    let totalGames = 0;
    for(let i = 0; i < data.length; i++) {
        totalGames += (data[i].blackWins + data[i].whiteWins + data[i].draws);
    }

    return data.filter(opening => {
        let gameCount = opening.blackWins + opening.whiteWins + opening.draws;
        return gameCount/totalGames > threshold;
    })
}

function applyFilters(data) {
    
    //Elo Filter

    //Time Control Filter
    let timeControls = [];
    if(document.getElementById("bulletCheckbox").checked) {timeControls.push(1)};
    if(document.getElementById("blitzCheckbox").checked) {timeControls.push(2)};
    if(document.getElementById("rapidCheckbox").checked) {timeControls.push(3)};
    if(document.getElementById("classicalCheckbox").checked) {timeControls.push(4)};
    return data.filter(game => timeControls.includes(game.TimeControl));

}

function aggregateData(data) {
    let openings = []

    for (let i = 0; i < data.length; i++) {
        let game = data[i];
        let opening = openings.find(x => x.name == game.Opening)
        if (opening) {
            opening.whiteWins += game.Result == 0?1:0;
            opening.blackWins += game.Result == 1?1:0;
            opening.draws += game.Result == 2?1:0;
            opening.gameLengthSum += game.noOfMoves;
            opening.maxRating = Math.max(opening.maxRating, game.Rating);
            opening.minRating = Math.min(opening.minRating, game.Rating);
            if (game.Variation) {
                let existingVariation = opening.variations.find(x => x.Variation == game.Variation);
                if (existingVariation) {
                    existingVariation.VarSum += 1;
                } else {
                    opening.variations.push({Variation: game.Variation, VarSum: 1});
                }
            } else {
                opening.variations.find(x => x.Variation == "No variation").VarSum +=1;
            }
        } else {
            let whiteWin = game.Result == 0?1:0;
            let blackWin = game.Result == 1?1:0;
            let draw = game.Result == 2?1:0;
            let variationExists = game.Variation == null?false:true;
            let variationsArray = [];
            if (variationExists) {
                variationsArray.push({Variation: "No variation", VarSum: 0})
                variationsArray.push({Variation: game.Variation, VarSum: 1});
            } else { variationsArray.push({Variation: "No variation", VarSum: 1})}
            let gameRating = game.Rating;
            let newOpening = {name: game.Opening,
                             whiteWins: whiteWin, 
                             blackWins: blackWin, 
                             draws: draw,
                             gameLengthSum: game.noOfMoves,
                             variations: variationsArray,
                             minRating: gameRating,
                             maxRating: gameRating};
            openings.push(newOpening);
        }
    }

    for (let i = 0; i < openings.length; i++) {
        openings[i]["avgGameLength"] = openings[i].gameLengthSum/(openings[i].whiteWins + openings[i].blackWins + openings[i].draws);
        delete openings[i].gameLengthSum;
    }
    return openings
}