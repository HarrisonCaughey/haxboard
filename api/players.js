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

async function players(req, res) {
    console.log("api/players endpoint hit in serverless function")
    if (req.method === 'GET') {
        db.select('*')
            .from('Players')
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
    } else if (req.method === 'PUT') {
        let player = req.body.player;
        let id = req.body.id;
        db('Players').where({id: id})
            .update({
                name: player.name,
                games_played: player.games_played,
                games_won: player.games_won,
                elo: player.elo,
                mvps: player.mvps,
                goals: player.goals,
                assists: player.assists,
                kicks: player.kicks,
                passes: player.passes,
                shots_on_goal: player.shots_on_goal,
                own_goals: player.own_goals
            })
            .then((data) => {
                res.json(data);
            }).catch((err) => {
            console.log(err)
        })
    } else if (req.method === 'POST') {
        let player = req.body.player;
        db('Players').insert(player, 'id')
            .then((data) => {
                res.json(data);
            }).catch((err) => {
            console.log(err)
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default players;