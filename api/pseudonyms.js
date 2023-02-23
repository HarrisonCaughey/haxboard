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

async function pseudonyms(req, res) {
    console.log("api/pseudonyms endpoint hit in serverless function")
    if (req.method === 'GET') {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query(
                'SELECT * ' +
                'FROM public."Pseudonyms"', (err, data) => {
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
        let pseudonyms = req.body.pseudonyms
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO public."Pseudonyms" (pseudonyms) '
                    + 'VALUES ($1)', [pseudonyms],
                    (err, data) => {
                    done()
                    if (err) {
                        console.log(err.stack)
                        res.status(500).message(err)
                    }
                    else {
                        console.log("Pseudonym added to the database")
                        res.send(200)
                    }
                })
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default gameStats;