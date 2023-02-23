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
    let offset = (req.query.page - 1) * 10;
    let order = req.query.order;
    let direction = req.query.direction
    db.select('*')
            .from('Games')
            .orderBy(order, direction)
            .offset(offset)
            .limit(10)
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
})

app.post('/api/games', (req, res) => {
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
})

app.delete('/api/games', (req, res) => {
    let id = req.body.id
    db('Games').where({id: id}).del()
            .then((data) => {
                res.json(data)
            }).catch((err) => {
                console.log(err)
                res.status(500).message(err)
    })
})

app.get('/api/players', (req, res) => {
    db.select('*')
            .from('Players')
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
})

app.post('/api/players', (req, res) => {
    let player = req.body.player;
    db('Players').insert(player, 'id')
        .then((data) => {
            res.json(data);
        }).catch((err) => {
            console.log(err)
        })
})

app.get('/api/playerGameStats', (req, res) => {
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
})

app.post('/api/playerGameStats', (req, res) => {
    let player = req.body.playerGameStats
    console.log(player)
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
})

app.delete('/api/playerGameStats', (req, res) => {
    let id = req.body.id
    db('PlayerGameStats').where({id: id}).del()
        .then((data) => {
            res.json(data)
        }).catch((err) => {
        console.log(err)
        res.status(500).message(err)
    })
})

app.get('/api/binary', (req, res) => {
    db.select('*')
        .from('Binaries')
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
})

app.post('/api/binary', (req, res) => {
    let file = req.body.file
    db('Binaries').insert(
        {
            file: file
        })
        .then((data) => {
            console.log(data)
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
})

app.delete('/api/binary', (req, res) => {
    let id = req.body.id
    db('Binaries').where({id: id}).del()
        .then((data) => {
            res.json(data)
        }).catch((err) => {
        console.log(err)
        res.status(500).message(err)
    })
})

app.get('/api/pseudonyms', (req, res) => {
    db.select('*')
        .from('Pseudonyms')
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
})

app.post('/api/pseudonyms', (req, res) => {
    let pseudonyms = req.body.pseudonyms
    db('Pseudonyms').insert(
        {
            pseudonyms: pseudonyms
        })
        .then((data) => {
            console.log(data)
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
})

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})