const fs = require("fs");
const readline = require('readline');

async function pgnToJson(filename) {
    const fileStream = fs.createReadStream(filename + ".txt");

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let gameCounter = 0;
    let games = [];
    for await (const line of rl) {

        if(line.startsWith("[")) {
            //Extract info from line
            let cleanLine = line.substring(1, line.length - 1);
            let lineTokens = cleanLine.split(' ');
            lineTokens = [lineTokens[0], lineTokens.slice(1).join(' ')]
            lineTokens[1] = lineTokens[1].substring(1, lineTokens[1].length - 1);

            //Add information to game
            if(games[gameCounter] == null) {
                games[gameCounter] = {};
                games[gameCounter][lineTokens[0]] = lineTokens[1];
            } else {
                games[gameCounter][lineTokens[0]] = lineTokens[1];
            }
        } else if(line.startsWith("1") || line.startsWith("0")) {
            games[gameCounter]["moves"] = line;
            cleanData(games[gameCounter]);
            gameCounter += 1;
        }
    }

    console.log(games.length);
    //let cleanGames = cleanData(games);
    //console.log(cleanGames.length);
    let validCleanGames = games.filter(game => game["noOfMoves"] > 1);
    console.log(validCleanGames.length);
    validCleanGames = validCleanGames.filter(game => game.Opening != "Blackburne Shilling Gambit"); 
    console.log(validCleanGames.length);
    openingInformation = aggregateDataIntoOpenings(validCleanGames);
    saveOpenings(validCleanGames);
    fs.writeFile(filename + "_.json", JSON.stringify(openingInformation, null, 2), 'utf8', () => {});
    //fs.writeFile(filename + ".json", JSON.stringify(validCleanGames, null, 2), 'utf8', () => {});
}

pgnToJson("lichess5");

function aggregateDataIntoOpenings(games) {
    let openingInfo = {};
    
    for(let elo = 600; elo < 3000; elo += 50) {
        for(let time = 1; time <= 4; time++) {

            let data = games.filter(game => game.Rating >= elo && game.Rating < (elo + 50) && game.TimeControl == time);

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
            openingInfo["rating_" + elo + "_time_" + time] = openings;
        }
    }
    return openingInfo;
}

function cleanData(game) {

    delete game["Event"];
    delete game["Site"];
    delete game["Date"];
    delete game["Round"];
    delete game["White"];
    delete game["Black"];
    delete game["UTCDate"];
    delete game["UTCTime"];
    delete game["ECO"];
    game["Rating"] = (parseInt(game["WhiteElo"]) + parseInt(game["BlackElo"]) ) / 2;
    game["TimeControl"] = encodeTime(game["TimeControl"]);
    game["Result"] = encodeResult(game["Result"]);
    delete game["WhiteElo"]
    delete game["BlackElo"]
    delete game["WhiteRatingDiff"];
    delete game["BlackRatingDiff"];
    delete game["Termination"];
    game["noOfMoves"] = lengthOfGame(game.moves);
    delete game["moves"];

    let openingString = game["Opening"].split(":");
    let openingFamilySplit = openingString[0].split(",");
    game["Opening"] = openingFamilySplit[0].trim();
    if( openingFamilySplit.length > 1) {
        let familyVariation = openingFamilySplit;
        familyVariation.shift();
        if(typeof familyVariation != "string") {
            familyVariation = familyVariation.join(",");
        }
        game["Variation"] = familyVariation.trim();
    } else if(openingString.length > 1) {
        let variationStrings = openingString[1].split(",");
        game["Variation"] = variationStrings[0].trim(); 
    } else {
        game["Variation"] = "Main Line";
    }
    
}

function encodeResult(result) {
    if(result == "1-0") {
        return 0
    } else if (result == "0-1") {
        return 1
    } else {
        return 2
    }
}

function encodeTime(timeString) { 
    let ts = timeString.split("+")
    let baseTime = ts[0]
    if(baseTime >= 0 && baseTime <= 120) {
        return 1
    } else if (baseTime > 120 && baseTime <= 360) {
        return 2
    } else if (baseTime > 360 && baseTime <= 1000) {
        return 3
    } else {
        return 4
    }
}

function lengthOfGame(gameString) {
    const pattern = new RegExp(/[0-9]+\./g);
    let occurences = gameString.match(pattern);
    if(occurences != null) {
        let noOfMoves = occurences[occurences.length - 1].substr(0, occurences[occurences.length - 1].length - 1);
        return parseInt(noOfMoves);
    } else {
        return 0;
    }
}

function saveOpenings(games) {
    let openingArray = []
    for(let i = 0; i < games.length; i++) {
        if(!openingArray.includes(games[i].Opening)) {
            openingArray.push(games[i].Opening);
        }
    }
    fs.writeFile("openings.json", JSON.stringify(openingArray, null, 2), 'utf8', () => {});
}