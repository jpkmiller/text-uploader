# text-uploader

A simple text uploader using [node.js](https://nodejs.org).\
Texts are deleted after 24 hours.

## REST API

`POST /upload/ + text` to upload text and receive hash\
`GET /request/ + hash` to get text from hash
