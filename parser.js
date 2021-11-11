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
            gameCounter += 1;
        }
    }
    let cleanGames = cleanData(games);
    console.log(cleanGames.length);
    let validCleanGames = cleanGames.filter(game => game["noOfMoves"] > 1);
    console.log(validCleanGames.length);
    validCleanGames = validCleanGames.filter(game => game.Opening != "Blackburne Shilling Gambit"); 
    console.log(validCleanGames.length);
    fs.writeFile(filename + ".json", JSON.stringify(validCleanGames, null, 2), 'utf8', () => {});
}

pgnToJson("lichess2");


function cleanData(games) {

    for(let i = 0; i < games.length; i++) {
        delete games[i]["Event"];
        delete games[i]["Site"];
        delete games[i]["Date"];
        delete games[i]["Round"];
        delete games[i]["White"];
        delete games[i]["Black"];
        delete games[i]["UTCDate"];
        delete games[i]["UTCTime"];
        delete games[i]["ECO"];
        games[i]["Rating"] = (parseInt(games[i]["WhiteElo"]) + parseInt(games[i]["BlackElo"]) ) / 2;
        games[i]["TimeControl"] = encodeTime(games[i]["TimeControl"]);
        games[i]["Result"] = encodeResult(games[i]["Result"]);
        delete games[i]["WhiteElo"]
        delete games[i]["BlackElo"]
        delete games[i]["WhiteRatingDiff"];
        delete games[i]["BlackRatingDiff"];
        delete games[i]["Termination"];
        games[i]["noOfMoves"] = lengthOfGame(games[i].moves);
        delete games[i]["moves"];

        let openingString = games[i]["Opening"].split(":");
        let openingFamilySplit = openingString[0].split(",");
        games[i]["Opening"] = openingFamilySplit[0].trim();
        if( openingFamilySplit.length > 1) {
            let familyVariation = openingFamilySplit;
            familyVariation.shift();
            if(typeof familyVariation != "string") {
                familyVariation = familyVariation.join(",");
            }
            games[i]["Variation"] = familyVariation.trim();
        } else if(openingString.length > 1) {
            let variationStrings = openingString[1].split(",");
            games[i]["Variation"] = variationStrings[0].trim(); 
        } else {
            games[i]["Variation"] = "Main Line";
        }
    }

    return games;
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