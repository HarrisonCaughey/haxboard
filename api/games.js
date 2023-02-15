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
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query(
                    'SELECT Game.id, Game.date_played, Game.player_one, Game.player_two, Game.score, Game.player_one_win, Player.name as p1_name, Player2.name as p2_name '
                    + 'FROM public."Game" as Game LEFT JOIN public."Player" as Player ON Game.player_one = Player.id '
                    + 'LEFT JOIN public."Player" as Player2 ON Game.player_two = Player2.id', (err, data) => {
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
            client.query('INSERT INTO public."Game" (player_one, player_two, player_one_win, score, date_played) '
                    + 'VALUES ($1, $2, $3, $4, $5)',
                    [game.player_one, game.player_two, game.player_one_win, game.score, game.date_played],
                    (err, data) => {
                    done()
                    if (err) {
                        console.log(err.stack)
                        res.status(500).message(err)
                    }
                    else {
                        console.log("Game entered into the database")
                        res.send(200)
                    }
                })
        })
    } else if (req.method === 'DELETE') {
        let id = req.body.id
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('DELETE FROM public."Game" WHERE id=$1',
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

async function getGames(client) {
    console.log("Getting games")
    try {
        let games = await client.query(
            'SELECT Game.id, Game.date_played, Game.player_one, Game.player_two, Game.score, Game.player_one_win, Player.name as p1_name, Player2.name as p2_name '
            + 'FROM public."Game" as Game LEFT JOIN public."Player" as Player ON Game.player_one = Player.id '
            + 'LEFT JOIN public."Player" as Player2 ON Game.player_two = Player2.id', (res) => {
                console.log("res")
                console.log(res)
                return res;
            })
        console.log("games")
        console.log(games)
        return games;
    } catch (err) {
        console.log("error caught3")
        console.log(err)
    }
}

async function postGame(game, client) {
    console.log("Posting game:");
    try {
        return await client.query('INSERT INTO public."Game" (player_one, player_two, player_one_win, score, date_played) '
                + 'VALUES ($1, $2, $3, $4, $5)',
                [game.player_one, game.player_two, game.player_one_win, game.score, game.date_played],
                (err, res) => {
                    console.log('Posted game, got response:')
                    console.log(res)
                    return res
                })
    } catch (err) {
        console.log(err)
    }
}

export default games;