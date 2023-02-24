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

async function binary(req, res) {
    console.log("api/binary endpoint hit in serverless function")
    if (req.method === 'GET') {
        db.select('*')
            .from('Binaries')
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
    } else if (req.method === 'POST') {
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
    } else if (req.method === 'DELETE') {
        let id = req.body.id
        db('Binaries').where({id: id}).del()
            .then((data) => {
                res.json(data)
            }).catch((err) => {
            console.log(err)
            res.status(500).message(err)
        })
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default binary;