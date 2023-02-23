import {getPlayers, getPseudonyms, saveBinaryFile, saveGame, savePlayerGameStats, updatePlayer} from "./api";

let pseuds = {}
let dbPlayers = {}

export async function saveGames(file, games) {

    console.log(games)
    let binaryId = -1
    // saveBinaryFile(file).then ((res) => {
    //     binaryId = res.data
    // }).catch((error) => {
    //     console.log(error)
    // })
    //TODO POST FILE
    getPseudonyms().then((res) => {
        pseuds = createPseudsMap(res.data)
        console.log(pseuds)
    })

    getPlayers().then((res) => {
        dbPlayers = createPlayersMap(res.data)
        console.log(dbPlayers)
    })

    for (const game of games) {
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

        let cleanGame = {
            red_score: game.scoreRed,
            blue_score: game.scoreBlue,
            red_possession: (game.possRed / (game.possRed + game.possBlue) * 100).toFixed(1),
            blue_possession: (game.possBlue / (game.possRed + game.possBlue) * 100).toFixed(1),
            game_time: (game.gameTicks / 60).toFixed(),
            red_team: getPseuds(game.redTeam),
            blue_team: getPseuds(game.blueTeam),
            date: getDateFromFile(file),
            binary_id: binaryId
        }

        if (checkGameValidity(cleanGame)) {
            let gameId = await saveGame(cleanGame).catch((err) => console.log(err))
            await savePlayerStats(gameId, playerStats)
            console.log(cleanGame)
            console.log(playerStats)
        }
    }
}

function getPseuds(listOfNicks) {
    let listOfIds = []
    listOfNicks.forEach(nick => {
        if (pseuds[nick] !== undefined) {
            listOfIds.push(pseuds[nick])
        } else {
            //TODO notify if doestn exist in pseuds
        }
    })
    return listOfIds
}


function getDateFromFile(file) {
    var fileName = file.name;
    return new Date(fileName.slice(fileName.indexOf("-")+1, fileName.lastIndexOf("-")));
}



function checkGameValidity(game) {
    // score check
    if (game.red_score === game.blue_score) return false;

    if (game.red_score < 3 && game.blue_score < 3) return false;

    if (game.red_score > 5 || game.blue_score > 5) return false;

    //player check
    if (game.red_team.length !== game.blue_team.length) return false;

    const playersPlayedList = game.red_team.concat(game.blue_team);
    const playersPlayedSet = new Set(playersPlayedList);
    if (playersPlayedList.length !== playersPlayedSet.size) return false;

    return true
}

function calculateElo() {
    return 0
}

function calculateMvp() {
    return 0;
}

function calculateOwnGoals() {
    return 0;
}

async function savePlayerStats(gameId, playerStats) {
    for (const player of playerStats) {
        let cleanPlayerGamestats = {
            game_id: gameId,
            player_id: player.id,
            goals: player.goals,
            assists: player.assists,
            kicks: player.kicks,
            passes: player.passes,
            shots_on_goal: player.shots,
            own_goals: 0,
            won: player.won
        }

        await savePlayerGameStats(cleanPlayerGamestats).catch((err) => console.log(err))

        let oldPlayer = dbPlayers[player.id] // TODO dbPlayers???
        let updatedPlayer = {
            games_played: oldPlayer.games_played + 1,
            games_won: player.won ? oldPlayer.games_won + 1 : oldPlayer.games_won,
            elo: oldPlayer.elo + calculateElo(),
            mvps: oldPlayer.mvps + calculateMvp(),
            goals: oldPlayer.goals + cleanPlayerGamestats.goals,
            assists: oldPlayer.assists + cleanPlayerGamestats.assists,
            kicks: oldPlayer.kicks + cleanPlayerGamestats.kicks,
            passes: oldPlayer.passes + cleanPlayerGamestats.passes,
            shots_on_goal: oldPlayer.shots_on_goal + cleanPlayerGamestats.shots_on_goal,
            own_goals: oldPlayer.own_goals + calculateOwnGoals()
        }
        await updatePlayer(updatedPlayer, player.id).catch((err) => console.log(err))
    }
}

function processPlayerStats(game) {
    var gameStats = []
    for (var i = 0; i < game.player.length; i++) {
        game.player[i].id = pseuds[game.player[i].nick] ? pseuds[game.player[i].nick] : -1
        var pr = game.player[i], prGoals = 0, prAssists = 0, prKicks = 0, prPasses = 0, prShots = 0;

        for (var j = 0; j < game.goals.length; j++) {
            if (game.goals[j].scorer === pr.nick) prGoals++;
            else if (game.goals[j].assist === pr.nick) prAssists++;
        }
        for (var j = 0; j < game.kicks.length; j++) if (game.kicks[j] === pr.nick) prKicks++;
        for (var j = 0; j < game.passes.length; j++) if (game.passes[j] === pr.nick) prPasses++;
        for (var j = 0; j < game.shots.length; j++) if (game.shots[j] === pr.nick) prShots++;
        if (!game.spaceMode) {
            let won = true
            if (game.scoreRed > game.scoreBlue) {
                if (game.blueTeam.includes(pr.nick)) won = false;
            } else {
                if (game.redTeam.includes(pr.nick)) won = false;
            }
            const plyr = {
                id: pr.id, nick: pr.nick, goals: prGoals, assists: prAssists, kicks: prKicks, passes: prPasses, shots: prShots, won: won
            };
            gameStats.push(plyr);
        }
    }
    return gameStats
}

function createPseudsMap(data) {
    let map = {};
    data.forEach((pseud) => {
        map[pseud.pseudonym] = pseud.player_id
    })
    return map;
}

function createPlayersMap(data) {
    let map = {};
    data.forEach((player) => {
        map[player.id] = player
    })
    return map;
}