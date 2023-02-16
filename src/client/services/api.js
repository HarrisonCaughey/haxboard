import axios from 'axios';

const serverPath = process.env.NODE_ENV !== 'development' ? "https://haxboard.vercel.app" : 'http://localhost:3001';

export function getGames() {
    return axios.get(`${serverPath}/api/games`).then((games) => {
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
