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

async function pseudonyms(req, res) {
    console.log("api/pseudonyms endpoint hit in serverless function")
    if (req.method === 'GET') {
        db.select('*')
            .from('Pseudonyms')
            .then((data) => {
                res.json(data);
            })
            .catch((err) => {
                console.log(err);
            });
    } else if (req.method === 'POST') {
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
            });
    } else {
        res.status(400).send("Method not allowed");
    }
}

export default pseudonyms;