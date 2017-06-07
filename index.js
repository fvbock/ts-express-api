"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var app = express();
// For POST-Support
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.get('/', function (request, response) {
    response.send('Hello World!');
});
app.get('/api/sayhello/:name', function (request, response) {
    var name = request.params.name;
    if (!isNaN(name)) {
        response
            .status(400)
            .send('No string as name');
    }
    else {
        response.json({
            "message": name
        });
    }
});
app.post('/api/sayhello', upload.array(), function (request, response) {
    var name = request.body.name;
    if (!isNaN(name)) {
        response
            .status(400)
            .send('No string as name');
    }
    else {
        console.log('Hello ' + name);
    }
    response.send('POST request to homepage');
});
app.listen(3000);
