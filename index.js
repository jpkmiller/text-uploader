const express = require('express')
const fs = require('fs');
const app = express()
const cors = require('cors');
const port = process.env.PORT

const hasha = require('hasha');

// INIT SERVER
app.listen(port, () => console.log('Server started on port', port))
app.use(express.static('public'));
app.use(cors())

// READ FILES
const images_json = fs.readFileSync('images.json')
const images = JSON.parse(images_json)

app.post('upload/:base64', (req, res) => {
    const base64 = req.params.base64
    var imgHash
    (async () => {
        imgHash = await hasha.async('base64')
        images[imgHash] = {
            image: base64,
            created: new Date()
        }
        res.send(imgHash)
    })
    // WRITE BACK FILE
    (async () => {
        fs.writeFile('images.json', JSON.stringify(images), 'utf-8')
    })
})

app.get('request/:hash', (req, res) => {
    const hash = req.params.hash
    res.send(images[hash].image)
})


// DELETE IMAGES AFTER 24 HOURS
const checkImages = () => {
    const now = new Date()
    const imgHashes = Object.keys(images)
    for (let index = 0; index < imgHashes.length; index++) {
        imgHash = imgHashes[i]
        if (images.hasOwnProperty(imgHash)) {
            const date = image[imgHash].created
            
            // CHECK IF 24 HOURS HAVE PASSED
            if (now - date >= 60 * 60 * 24 * 1000) {
                console.log(`Deleting image ${imgHash}`)
                delete images[imgHash]
            }
        }
    }
}

setInterval(() => {
    checkImages()
}, 60 * 60 * 24 * 1000)