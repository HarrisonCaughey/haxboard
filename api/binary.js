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

async function binary(req, res) {
    console.log("api/binary endpoint hit in serverless function")
    if (req.method === 'GET') {
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query(
                'SELECT * ' +
                'FROM public."Binaries" ', (err, data) => {
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
        let file = req.body.file
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('INSERT INTO public."Binaries" (file) ' +
                    'VALUES ($1); ' +
                    'SELECT SCOPE_IDENTITY();',
                    [file],
                    (err, data) => {
                    done()
                    if (err) {
                        console.log(err.stack)
                        res.status(500).message(err)
                    }
                    else {
                        console.log("Binary file saved into the database")
                        res.status(200).json(data.rows)
                    }
                })
        })
    } else if (req.method === 'DELETE') {
        let id = req.body.id
        pool.connect((err, client, done) => {
            if (err) throw err
            client.query('DELETE FROM public."Binaries" WHERE id=$1',
                    [id],
                    (err, data) => {
                        done()
                        if (err) {
                            console.log(err.stack)
                            res.status(500).message(err)
                        }
                        else {
                            console.log("Binary file deleted from the database")
                            res.send(200)
                        }
                    })
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default binary;