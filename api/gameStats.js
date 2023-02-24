const knex = require('knex');
require('dotenv').config();
const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
        port: process.env.PORT,
    },
});

async function playerGameStats(req, res) {
    console.log("api/playerGameStats endpoint hit in serverless function")
    if (req.method === 'GET') {
        let playerId = req.query.player_id;
        let gameId = req.query.game_id
        db.select('*')
            .from('PlayerGameStats')
            .where({
                game_id: gameId,
                player_id: playerId
            })
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
    } else if (req.method === 'POST') {
        let stats = req.body.playerGameStats
        db('PlayerGameStats').insert(
            {
                game_id: player.game_id,
                player_id: player.player_id,
                goals: player.goals,
                assists: player.assists,
                kicks: player.kicks,
                passes: player.passes,
                shots_on_goal: player.shots_on_goal,
                own_goals: player.own_goals,
                won: player.won
            })
            .then((data) => {
                console.log(data)
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
    } else if (req.method === 'DELETE') {
        let gameId = req.body.game_id
        let playerId = req.body.player_id
        db('PlayerGameStats').where({
            player_id: playerId,
            game_id: gameId}).del()
            .then((data) => {
                res.json(data)
            }).catch((err) => {
            console.log(err)
            res.status(500).message(err)
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default playerGameStats;