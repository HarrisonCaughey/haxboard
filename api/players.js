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
                    'SELECT * FROM public."Player"', (err, data) => {
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
                    'UPDATE public."Player" ' +
                    'SET games_won=$1, games_lost=$2, rounds_won=$3, rounds_lost=$4, points_won=$5, points_lost=$6, game_history=$7 ' +
                    'WHERE id = $8;',
                    [player.games_won, player.games_lost, player.rounds_won, player.rounds_lost,
                    player.points_won, player.points_lost, player.game_history, id],
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

// async function getPlayers(client) {
//     console.log("Getting players")
//     return await client.query('SELECT * FROM public."Player"', (err, res) => {
//         return res
//     }).catch(err => {
//         console.log(err)
//     });
// }
//
// async function putPlayer(player, id, client) {
//     await client.connect();
//     return await client.query('UPDATE public."Player" ' +
//             'SET games_won=$1, games_lost=$2, rounds_won=$3, rounds_lost=$4, points_won=$5, points_lost=$6, game_history=$7 ' +
//             'WHERE id = $8;',
//             [player.games_won, player.games_lost, player.rounds_won, player.rounds_lost,
//             player.points_won, player.points_lost, player.game_history, id], (err, res) => {
//         console.log('Posted game, got response:')
//         console.log(res)
//         return res
//     })
// }

export default players;