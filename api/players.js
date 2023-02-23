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

async function players(req, res) {
    console.log("api/players endpoint hit in serverless function")
    if (req.method === 'GET') {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query(
                    'SELECT * FROM public."Players"', (err, data) => {
                        done()
                        if (err) {
                            console.log(err.stack)
                            res.status(500).message(err)
                        } else {

                            res.status(200).json(data.rows)
                        }
                    })
        })
    } else if (req.method === 'PUT') {
        pool.connect((err, client, done) => {
            if (err) throw err
            let player = req.body.player;
            let id = req.body.id;
            client.query(
                    'UPDATE public."Players" ' +
                    'SET name=$1, games_played=$2, games_won=$3, elo=$4, mvps=$5, goals=$6, assists=$7, kicks=$8, ' +
                    'passes=$9, shots_on_goal=$10, own_goals=$11 ' +
                    'WHERE id = $12;',
                    [player.name, player.games_played, player.games_won, player.elo, player.mvps, player.goals,
                    player.assists, player.kicks, player.passes, player.shots_on_goal, player.own_goals, id],
                    (err, data) => {
                        done()
                        if (err) {
                            console.log(err.stack)
                            res.status(500).message(err)
                        } else {
                            console.log("Player information updated")
                            res.send(204)
                        }
                    })
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default players;