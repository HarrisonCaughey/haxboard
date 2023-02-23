const { Pool } = require('pg')

const pool = new Pool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT
})

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

async function games(req, res) {
    console.log("api/games endpoint hit in serverless function")
    if (req.method === 'GET') {
        let offset = req.body.page ? (req.body.page - 1) * 10 : 0;
        let order = req.body.order ? req.body.order : "date";
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query(
                'SELECT * ' +
                'FROM public."Games" ' +
                'ORDER BY $1 ' +
                'OFFSET $2 LIMIT 10 ', [order, offset], (err, data) => {
                done()
                if (err) {
                    console.log(err.stack)
                    res.status(500).message(err)
                } else {
                    res.status(200).json(data.rows)
                }
            })
        })
    } else if (req.method === 'POST') {
        let game = req.body.game
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO public."Games" (team1, team2, team1_score, team2_score, ' +
                    'team1_possession, team2_possession, date, game_time, binary_id) ' +
                    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); ' +
                    'SELECT SCOPE_IDENTITY();',
                    [game.team1, game.team2, game.team1_score, game.team2_score, game.team1_possession,
                    game.team2_possession, game.date, game.game_time, game.binary_id],
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