import axios from 'axios';

const serverPath = process.env.NODE_ENV !== 'development' ? "https://haxboard.vercel.app" : 'http://localhost:3001';

export function getGames(page = 1, order = "date") {
    return axios.get(`${serverPath}/api/games`, { params: { page: page, order: order } }).then((games) => {
        return games;
    }).catch((err) => {
        console.error(err);
    })
}

export function saveGame(game) {
    return axios.post(`${serverPath}/api/games`, {game: game})
        .catch((err) => {
            console.error(err);
        })
}

export function deleteGame(id) {
    return axios.delete(`${serverPath}/api/games`, {data : {id: id}})
            .catch((err) => {
                console.error(err);
            })
}

export function getPlayers() {
    return axios.get(`${serverPath}/api/players`).then((players) => {
        return players;
    }).catch((err) => {
        console.error(err);
    })
}

export function updatePlayer(player, id) {
    return axios.put(`${serverPath}/api/players`, {player: player, id: id})
            .catch((err) => {
                console.error(err);
            })
}

export function getPlayerGameStats(gameId, playerId) {
    return axios.get(`${serverPath}/api/playerGameStats`, { params : {game_id: gameId, player_id: playerId}})
        .then((stats) => {
            return stats;
    }).catch((err) => {
        console.error(err);
    })
}

export function savePlayerGameStats(playerGameStats) {
    return axios.post(`${serverPath}/api/playerGameStats`, {playerGameStats: playerGameStats})
        .catch((err) => {
            console.error(err);
        })
}

export function deletePlayerGameStats(gameId, playerId) {
    return axios.delete(`${serverPath}/api/playerGameStats`, { params : {game_id: gameId, player_id: playerId}})
        .catch((err) => {
            console.error(err);
        })
}

export function getPseudonyms() {
    return axios.get(`${serverPath}/api/pseudonyms`).then((pseudonyms) => {
        return pseudonyms;
    }).catch((err) => {
        console.error(err);
    })
}

export function updatePseudonyms(pseudonyms, id) {
    return axios.put(`${serverPath}/api/pseudonyms`, {pseudonyms: pseudonyms, id: id})
        .catch((err) => {
            console.error(err);
        })
}
