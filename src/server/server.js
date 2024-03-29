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
    db.select('*')
            .from('Games')
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
                elo_change: game.elo_change
            }, 'id')
            .then((data) => {
                console.log(data)
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
                res.statusMessage = "Unique key restraint violated"
                res.status(500).json({"string": "String"}).end()
            });
})

app.put('/api/games', (req, res) => {
    let game = req.body.games
    db('Games').where({id: game.id})
        .update({
            elo_change: game.elo_change
        })
        .then((data) => {
            res.json(data);
        }).catch((err) => {
        console.log(err)
    })
    // return db.transaction(trx => {
    //     const queries = [];
    //     games.forEach(game => {
    //         const query = db('Games')
    //             .where('id', game.id)
    //             .update({
    //                 elo_change: game.elo_change,
    //             })
    //             .transacting(trx); // This makes every update be in the same transaction
    //         queries.push(query);
    //     });
    //
    //     Promise.all(queries) // Once every query is written
    //         .then(trx.commit) // We try to execute all of them
    //         .catch(trx.rollback); // And rollback in case any of them goes wrong
    // });
})

app.delete('/api/games', (req, res) => {
    let id = req.body.id
    db('Games').where({id: id}).del()
            .then((data) => {
                res.json(data)
            }).catch((err) => {
                console.log(err)
                res.statusMessage = "Server error deleting game"
                res.status(500).end()
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
    // let playerId = req.query.player_id;
    // let gameId = req.query.game_id
    db.select('*')
        .from('PlayerGameStats')
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
    let file_name = req.body.file_name
    db('Binaries').insert(
        {
            file: db.raw('?', file),
            file_name: file_name
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
        res.status(500).end(err)
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
            res.status(500).end(err)
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
            res.status(500).end(err)
        });
})

app.put('/api/playerElo', (req, res) => {
    let elo = req.body.elo;
    let id = req.body.id;
    db('Players').where({id: id})
        .update({
            elo: elo,
        })
        .then((data) => {
            res.json(data);
        }).catch((err) => {
        res.status(500).end(err)
    })
})

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})