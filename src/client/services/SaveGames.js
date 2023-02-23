export function saveGames(file, games) {

    console.log("filtering...")
    console.log(games)

    // POST FILE

    games.forEach( game => {
        let playerStats = processPlayerStats(game)

        //filter out from game and gamestats non-playing players  ////////////////////////////

        playerStats.forEach(player => {
            if (player.kicks < 5) {
                game.redTeam = game.redTeam.filter(nick => nick !== player.nick)
                game.blueTeam = game.blueTeam.filter(nick => nick !== player.nick)
            }
        })
        playerStats = playerStats.filter(player => player.kicks >= 5)

        ////////////////////////////////////////////////////////////////////////////////////
        game.redTeamPossession = (game.possRed / (game.possRed + game.possBlue) * 100).toFixed(1)
        game.blueTeamPossession = (game.possBlue / (game.possRed + game.possBlue) * 100).toFixed(1)

        let cleanGame = {
            redTeamScore: game.scoreRed,
            blueTeamScore: game.scoreBlue,
            redTeamPossession:(game.possRed / (game.possRed + game.possBlue) * 100).toFixed(1),
            blueTeamPossession: (game.possBlue / (game.possRed + game.possBlue) * 100).toFixed(1),
            gameTime: (game.gameTicks/60).toFixed(),
            redTeam: game.redTeam,
            blueTeam: game.blueTeam,
            date: getDateFromFile(file),
            fileId: 0o0000000000000000000000000000
        }

        if (checkGameValidity(cleanGame)) {
            // POST GAME
            //POST GAME STATS
            //PUT PLAYER
        }
        console.log(cleanGame)
    })
}

function getDateFromFile(file) {
    var fileName = file.name;
    var date = new Date()
    console.log(fileName); // HBReplay-2023-02-15-14h22m.hbr2
    return new Date(fileName.slice(fileName.indexOf("-")+1, fileName.lastIndexOf("-")));
}

function checkGameValidity(game) {
    // score check
    if (game.redTeamScore === game.blueTeamScore) return false;

    if (game.redTeamScore < 3 && game.blueTeamScore < 3) return false;

    if (game.redTeamScore > 5 || game.blueTeamScore > 5) return false;

    //player check
    if (game.redTeam.length !== game.blueTeam.length) return false;

    const playersPlayedList = game.redTeam.concat(game.blueTeam);
    const playersPlayedSet = new Set(playersPlayedList);
    if (playersPlayedList.length !== playersPlayedSet.length) return false;

    return true
}

function processPlayerStats(game) {
    var gameStats = []
    for (var i = 0; i < game.player.length; i++) {

        var pr = game.player[i], prGoals = 0, prAssists = 0, prKicks = 0, prPasses = 0, prShots = 0;

        console.log(pr)
        for (var j = 0; j < game.goals.length; j++) {
            if (game.goals[j].scorer === pr.nick) prGoals++;
            else if (game.goals[j].assist === pr.nick) prAssists++;
        }
        for (var j = 0; j < game.kicks.length; j++) if (game.kicks[j] === pr.nick) prKicks++;
        for (var j = 0; j < game.passes.length; j++) if (game.passes[j] === pr.nick) prPasses++;
        for (var j = 0; j < game.shots.length; j++) if (game.shots[j] === pr.nick) prShots++;
        if (!game.spaceMode) {
            const plyr = {
                nick: pr.nick, goals: prGoals, assists: prAssists, kicks: prKicks, passes: prPasses, shots: prShots,
            };
            gameStats.push(plyr);
        }
    }
    console.log(gameStats)
    return gameStats
}


