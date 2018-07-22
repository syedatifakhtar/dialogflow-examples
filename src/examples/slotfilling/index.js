'use strict';

var listeningport = process.env.PORT || 3000;

const express = require('express');
const bodyParser = require('body-parser');
const {WebhookClient} = require("./dialogflow-fulfillment-nodejs/src/dialogflow-fulfillment");
const {SimpleResponse} = require("actions-on-google");

function logResponseBody(req, res, next) {
    var oldWrite = res.write,
        oldEnd = res.end;

    var chunks = [];

    res.write = function (chunk) {
        chunks.push(chunk);

        oldWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
        if (chunk)
            chunks.push(chunk);

        var body = Buffer.concat(chunks).toString('utf8');
        console.log(req.path, body);

        oldEnd.apply(res, arguments);
    };

    next();
}


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(logResponseBody);
process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements


app.listen(listeningport, function () {
    console.log('BOT listening at ...' + listeningport);
});


app.post('/slotfill', (request, response) => {

    console.log('*** Webhook for slotfill query ***');
    console.log(request);
    const agent = new WebhookClient({request: request, response: response});
    function pizzaOrder(agent) {
        console.log("Order pizza handler");
        if (agent.parameters['username'] != '') {
            console.log("Slot filling...");
            let conv = agent.conv();
            // conv.ask("Hello world"); //Does not work without Google Assistant Simulator
            agent.add('Details Fetched');
            agent.setFollowupEvent({
                    parameters: {
                        "pizzatype": agent.parameters['pizzatype'],
                        "pizzasize": agent.parameters['pizzasize'],
                        "username": agent.parameters['username'],
                        "address1": "woodlands drive 73",
                        "address2": " New jersy....",
                        "PhoneNo": "6512345678",
                        "email": "someone@somewhere.com"
                    },
                    name: "e_fetch_user_details"
                }
            );
            return;
        } else {
            agent.isEmpty = true;
            return;
        }
    }

    let intentMap = new Map();
    intentMap.set('pizzaorder', pizzaOrder);

    agent.handleRequest(intentMap);


});



