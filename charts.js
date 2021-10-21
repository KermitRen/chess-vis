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
    let filteredData = applyFilters(lichessData);
    let aggregatedData = aggregateData(filteredData);
    let cleanAggregatedData = removeInsignificantOpenings(aggregatedData);
    console.log(cleanAggregatedData.length)

    newBeeswarmChart(cleanAggregatedData, { 
        winrate: d => Math.abs(100*((d.whiteWins - d.blackWins)/(d.blackWins+d.whiteWins+d.draws))), 
        opening: d => d.name,
        whiteperc: d => 100*d.whiteWins/(d.whiteWins + d.blackWins + d.draws),
        blackperc: d => 100*d.blackWins/(d.whiteWins + d.blackWins + d.draws),
        drawperc: d => 100*d.drawWins/(d.whiteWins + d.blackWins + d.draws),
        wincolor: d => (d.whiteWins/(d.whiteWins + d.blackWins + d.draws)>(d.blackWins/(d.whiteWins + d.blackWins + d.draws)))?"White":"Black",
        xLabel: "% Winrate",
        width: document.getElementById("beeswarm1Container").getBoundingClientRect().width,
        height: document.getElementById("beeswarm1Container").getBoundingClientRect().height
    });
}

function removeInsignificantOpenings(data) {

    const threshold = 0.00005;
    let totalGames = 0;
    for(let i = 0; i < data.length; i++) {
        totalGames += (data[i].blackWins + data[i].whiteWins + data[i].draws);
    }

    return data.filter(opening => {
        console.log(opening);
        let gameCount = opening.blackWins + opening.whiteWins + opening.draws;
        //console.log(opening.name + " has " + (gameCount/totalGames));
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
        } else {
            let whiteWin = game.Result == 0?1:0;
            let blackWin = game.Result == 1?1:0;
            let draw = game.Result == 2?1:0;
            let newOpening = {name: game.Opening,
                             whiteWins: whiteWin, 
                             blackWins: blackWin, 
                             draws: draw,
                             gameLengthSum: game.noOfMoves}; 
            openings.push(newOpening);
        }
    }

    for (let i = 0; i < openings.length; i++) {
        openings[i]["avgGameLength"] = openings[i].gameLengthSum/(openings.whiteWins + openings.blackWins + openings.draws);
        delete openings[i].gameLengthSum;
    }
    
    return openings
}