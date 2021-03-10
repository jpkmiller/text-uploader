const express = require('express')
const rateLimit = require('express-rate-limit');
const {param} = require('express-validator');
const {MongoClient} = require('mongodb');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI;
const DELETION_THRESHOLD = 60 * 60 * 24 * 1000;

// INIT SERVER
const app = express()
const port = process.env.PORT || 8081
app.listen(port, () => console.log('Server started on port', port))
app.use(express.static('public'));
app.use(cors())

app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// RATE LIMIT
app.use(limiter)


app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname + '/index.html')
    res.status(200).sendFile(htmlPath)
})


// UPLOAD TEXT AND RECEIVE HASH AS RESPONSE
app.post('/upload/:text', param('text').isString().isLength({min: 1}).trim(), async (req, res) => {
    const text = req.params.text
    console.log(`Server received text ${text}.`)
    const shasum = crypto.createHash('sha512')
    const textHash = shasum.update(text + crypto.randomInt(10000)).digest('hex')

    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect()
        const database = client.db('texts')

        const items = database.collection('items')
        const created = new Date()
        await items.insertOne({_id: textHash, text: text, created: created})
        console.log(`Server uploaded text ${textHash} at ${created}.`)
    } catch (err) {
        console.error(err)
    } finally {
        await client.close()
    }

    // deepcode ignore XSS: using param from express-validator
    res.send(textHash)
})


// REQUEST TEXT BY PROVIDING A HASH
app.get('/request/:hash', param('hash').isString().isLength({min: 1}).trim(), async (req, res) => {
    const hash = req.params.hash
    console.log(`Server received hash ${hash}.`)

    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
        await client.connect()
        const database = client.db('texts');
        const collection = database.collection('items');
        // deepcode ignore Sqli: using param from express-validator
        await collection.findOne({_id: hash})
            .then(result => {
                if (result) {
                    // deepcode ignore XSS: using param from express-validator
                    console.log(`Server found ${result.text}.`)
                    // deepcode ignore XSS: using param from express-validator
                    res.send(result.text)
                } else {
                    res.sendStatus(404)
                }
            })
    } catch (err) {
        console.error(err)
    } finally {
        await client.close()
    }
})


// DELETE TEXTS AFTER 24 HOURS
const checktexts = async () => {
    console.log('Server checking for old items.')
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
        await client.connect()
        const database = client.db('texts')
        const items = database.collection('items')
        await items.deleteMany( { created : {"$lt" : new Date(Date.now() - DELETION_THRESHOLD) } })
    } catch (err) {
        console.error(err)
    } finally {
        await client.close()
    }
}

setInterval(() => {
    checktexts()
}, DELETION_THRESHOLD)