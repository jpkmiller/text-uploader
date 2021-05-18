# text-uploader

A simple text uploader using [node.js](https://nodejs.org).\
Texts are deleted after 24 hours.

Hosted on heroku. Try it [here](https://jpks-text-uploader.herokuapp.com/)

## REST API

`POST /upload/ + text` to upload text and receive hash\
`GET /request/ + hash` to get text from hash

## Getting started

To start the server type
```shell
npm run start
```

Open `index.html` and start sending requests via `localhost:8081` to the server
