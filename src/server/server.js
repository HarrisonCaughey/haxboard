const express = require('express')
const cors = require("cors");
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
const allowedOrigins = ['http://localhost:3000']

const app = express()
const port = 3001

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// CORS implemented so that we don't get errors when trying to access the server from a different server location
app.use(cors());
app.use(function (req, res, next) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
    next();
});

app.get('/api/games', (req, res) => {
    db.select('Game.id', 'Game.date_played', 'Game.player_one', 'Game.player_two', 'Game.score', 'Game.player_one_win', 'Player.name as p1_name', 'Player2.name as p2_name')
            .from('Game')
            .leftJoin('Player', 'Game.player_one', 'Player.id')
            .leftJoin('Player as Player2', 'Game.player_two', 'Player2.id')
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
})

app.post('/api/games', (req, res) => {
    let game = req.body.game
    db('Game').insert(
            {player_one: game.player_one,
                player_two: game.player_two,
                player_one_win: game.player_one_win,
                score: game.score,
                date_played: game.date_played,
            })
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
})

app.delete('/api/games', (req, res) => {
    let id = req.body.id
    db('Game').where({id: id}).del()
            .then((data) => {
                res.json(data)
            }).catch((err) => {
                console.log(err)
                res.status(500).message(err)
    })
})

app.get('/api/players', (req, res) => {
    db.select('*')
            .from('Player')
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
})

app.put('/api/players', (req, res) => {
    let player = req.body.player;
    let id = req.body.id;
    db('Player').where({id: id}).update(player).then((data) => {
        res.json(data);
    }).catch((err) => {
        console.log(err)
    })
})

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})