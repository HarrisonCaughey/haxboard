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

async function playerGameStats(req, res) {
    console.log("api/playerGameStats endpoint hit in serverless function")
    if (req.method === 'GET') {
        let playerId = req.query.player_id;
        let gameId = req.query.game_id
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query(
                'SELECT * ' +
                'FROM public."PlayerGameStats" ' +
                'WHERE game_id = $1 AND player_id = $2', [gameId, playerId], (err, data) => {
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
        let stats = req.body.playerGameStats
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO public."PlayerGameStats" (game_id, player_id, goals, assists, ' +
                    'kicks, passes, shots_on_goal, own_goals, won) ' +
                    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);',
                    [stats.game_id, stats.player_id, stats.goals, stats.assists, stats.kicks,
                    stats.passes, stats.shots_on_goal, stats.own_goals, stats.won],
                    (err, data) => {
                    done()
                    if (err) {
                        console.log(err.stack)
                        res.status(500).message(err)
                    }
                    else {
                        console.log("Game stats entered into the database")
                        res.send(200)
                    }
                })
        })
    } else if (req.method === 'DELETE') {
        let gameId = req.body.game_id
        let playerId = req.body.player_id
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('DELETE FROM public."PlayerGameStats" WHERE game_id=$1 AND player_id=$2',
                    [gameId, playerId],
                    (err, data) => {
                        done()
                        if (err) {
                            console.log(err.stack)
                            res.status(500).message(err)
                        }
                        else {
                            console.log("Deleted game stats from the database")
                            res.send(200)
                        }
                    })
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default playerGameStats;