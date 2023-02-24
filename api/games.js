const { Pool } = require('pg')
const knex = require('knex');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT
})

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

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

async function games(req, res) {
    console.log("api/games endpoint hit in serverless function")
    if (req.method === 'GET') {
        db.select('*')
            .from('Games')
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });

    } else if (req.method === 'POST') {
        let game = req.body.game
        db('Games').insert(
            {red_team: game.red_team,
                blue_team: game.blue_team,
                red_score: game.red_score,
                blue_score: game.blue_score,
                red_possession: game.red_possession,
                blue_possession: game.blue_possession,
                date: game.date,
                game_time: game.game_time,
                binary_id: game.binary_id,
            }, 'id')
            .then((data) => {
                console.log(data)
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
    } else if (req.method === 'DELETE') {
        let id = req.body.id
        db('Games').where({id: id}).del()
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

export default games;