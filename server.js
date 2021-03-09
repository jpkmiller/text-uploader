const express = require('express')
const fs = require('fs');
const path = require('path');
const app = express()
const cors = require('cors');
const port = process.env.PORT || 8081

const crypto = require('crypto');

const HOURS_24 = 60 * 60 * 24 * 1000;

// INIT SERVER
app.listen(port, () => console.log('Server started on port', port))
app.use(express.static('public'));
app.use(cors())

// READ FILES
const texts_json = fs.readFileSync('texts.json')
const texts = JSON.parse(texts_json)

app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname + '/index.html')
    res.status(200).sendFile(htmlPath)
})

app.post('/upload/:text', (req, res) => {
    const text = req.params.text
    console.log('Server received text')
    const shasum = crypto.createHash('sha512')
    const textHash = shasum.update(text + crypto.randomInt(10000)).digest('hex')
    console.log(`Server added text ${textHash}`)
    texts[textHash] = {
        text: text,
        created: new Date()
    }
    res.send(textHash)
    // WRITE BACK FILE
    fs.writeFileSync('texts.json', JSON.stringify(texts), 'utf-8')
})

app.get('/request/:hash', (req, res) => {
    const hash = req.params.hash
    console.log('Server received hash')
    if (texts.hasOwnProperty(hash)) {  
        const text = texts[hash].text
        console.log(`Server returns text ${text} from ${hash}`)
        res.send(text)
    } else {
        console.log('Server did not find text')
        res.sendStatus(404)
    }
})


// DELETE TEXTS AFTER 24 HOURS
const checktexts = () => {
    const now = new Date()
    const textHashes = Object.keys(texts)
    for (let index = 0; index < textHashes.length; index++) {
        textHash = textHashes[index]
        if (texts.hasOwnProperty(textHash)) {
            const date = Date.parse(texts[textHash].created)

            // CHECK IF 24 HOURS HAVE PASSED
            if (now - date >= HOURS_24) {
                console.log(`Deleting text ${textHash}`)
                delete texts[textHash]
            }
        }
    }
    fs.writeFileSync('texts.json', JSON.stringify(texts), 'utf-8')
}

setInterval(() => {
    checktexts()
}, HOURS_24)