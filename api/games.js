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
        // //let offset = (req.query.page - 1) * 10;
        // let order = req.query.order;
        // let direction = req.query.direction
        // pool.connect((err, client, done) => {
        //     if (err) throw err
        //     client.query(
        //         'SELECT * ' +
        //         'FROM public."Games" ' +
        //         "ORDER BY (case when $2 = 'ASC' then $1 end) ASC, " +
        //         "(case when $2 = 'DESC' then $1 end) DESC ", [order, direction], (err, data) => {
        //         done()
        //         if (err) {
        //             console.log(err.stack)
        //             res.status(500).message(err)
        //         } else {
        //             res.status(200).json(data.rows)
        //         }
        //     })
        // })
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
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO public."Games" (red_team, blue_team, red_score, blue_score, ' +
                    'red_possession, blue_possession, date, game_time, binary_id) ' +
                    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); ' +
                    'SELECT SCOPE_IDENTITY();',
                    [game.red_team, game.blue_team, game.red_score, game.blue_score, game.red_possession,
                    game.blue_possession, game.date, game.game_time, game.binary_id],
                    (err, data) => {
                    done()
                    if (err) {
                        console.log(err.stack)
                        res.status(500).message(err)
                    }
                    else {
                        console.log("Game entered into the database")
                        res.status(200).json(data.rows)
                    }
                })
        })
    } else if (req.method === 'DELETE') {
        let id = req.body.id
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('DELETE FROM public."Games" WHERE id=$1',
                    [id],
                    (err, data) => {
                        done()
                        if (err) {
                            console.log(err.stack)
                            res.status(500).message(err)
                        }
                        else {
                            console.log("Game from the database")
                            res.send(200)
                        }
                    })
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default games;