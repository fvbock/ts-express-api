import * as express from 'express';
// import express = require('express');
let app = express();

// For POST-Support
import * as bodyParser from 'body-parser';
// let bodyParser = require('body-parser');
import * as multer from 'multer';
// let multer = require('multer');
let upload = multer();

import * as yaml from 'js-yaml';
import * as fs from 'fs';
// yaml = require('js-yaml');
// fs   = require('fs');


app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (request, response) => {
    response.send('Hello World!');
});

app.get('/api/sayhello/:name', (request, response) => {
    let name = request.params.name;

    if (!isNaN(name)) {
        response
            .status(400)
            .send('No string as name');
    } else {
        response.json({
            'message': name
        });
    }
});

app.post('/api/sayhello', upload.array(), (request, response) => {
    let name = request.body.name;

    if (!isNaN(name)) {
        response
            .status(400)
            .send('No string as name');
    } else {
        console.log('Hello ' + name);
    }

    response.send('POST request to homepage');
});

app.post('/api/config', upload.array(), (request, response) => {
    // Get document, or throw exception on error
    try {
        let doc = yaml.safeLoad(fs.readFileSync('.fsms.yml', 'utf8'));
        console.log(doc);
    } catch (e) {
        console.log(e);
    }
}

app.listen(3000);
