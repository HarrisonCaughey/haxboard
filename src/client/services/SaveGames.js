export function filterGames(games) {

    console.log("filtering...")
    console.log(games)

    let invalidPlayers = []

    games.forEach( game => {

        checkGameValidity(game)

    })
}


function checkGameValidity(game) {
    let valid = true




    //if (game.blueTeam.length)
}

function processGameStats(game) {
    var gameStats = []
    var par = 1
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
}


