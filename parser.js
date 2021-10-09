document.addEventListener("DOMContentLoaded", pageLoaded);

function pageLoaded() {
    fetch("data/lichess.txt")
    .then(response => response.text())
    .then(data => pgnToJson(data));
}

function pgnToJson(text) {

    let lines = text.split('\n');
    let gameCounter = 0;
    let games = [];

    for(let i = 0; i < lines.length; i++) {

        if(lines[i].startsWith("[")) {
            //Extract info from line
            let line = lines[i].substring(1, lines[i].length - 1);
            let lineTokens = line.split(' ');
            lineTokens = [lineTokens[0], lineTokens.slice(1).join(' ')]
            lineTokens[1] = lineTokens[1].substring(1, lineTokens[1].length - 1);

            //Add information to game
            if(games[gameCounter] == null) {
                games[gameCounter] = {};
                games[gameCounter][lineTokens[0]] = lineTokens[1];
            } else {
                games[gameCounter][lineTokens[0]] = lineTokens[1];
            }
        } else if(lines[i].startsWith("1") || lines[i].startsWith("0")) {
            games[gameCounter]["moves"] = lines[i];
            gameCounter += 1;
        }
    }

    let cleanGames = removeUnimportantData(games);
    console.log(cleanGames);
}

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
        delete games[i]["WhiteRatingDiff"];
        delete games[i]["BlackRatingDiff"];
        delete games[i]["Termination"];
        games[i]["noOfMoves"] = lengthOfGame(games[i].moves);
    }

    return games;
}

function lengthOfGame(gameString) {
    const pattern = new RegExp(/[0-9]+\./g);
    let occurences = gameString.match(pattern);
    if(occurences != null) {
        let noOfMoves = occurences[occurences.length - 1].substr(0, occurences[occurences.length - 1].length - 1);
        return noOfMoves;
    } else {
        return 0;
    }
}

function examineData(games) {

    console.log(games);

    console.log("There are " + games.length + " games in total");
    let openings = {};
    let noOfOpenings = 0;
    
    //Extract Openings
    for(let i = 0; i < games.length; i++) {

        let opening = games[i].Opening;
        if(!(opening in openings)) {
            openings[opening] = 1;
            noOfOpenings += 1;
        } else {
            openings[opening] += 1;
        }
    }

    //Group openings
    let openingGroups = {}
    let noOfOpeningGroups = 0;
    for(key in openings) {
        let openingGroup = key.substr(0, key.indexOf(':'));

        if(openingGroup == "") {
            openingGroup = key;
        }

        if(!(openingGroup in openingGroups)) {
            openingGroups[openingGroup] = openings[key];
            noOfOpeningGroups += 1;
        } else {
            openingGroups[openingGroup] += openings[key];
        }
    }

    console.log("There are " + noOfOpeningGroups + " different opening groups");
    console.log(openingGroups);

    //console.log("There are " + noOfOpenings + " different openings");
}
