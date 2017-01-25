'use strict';

const async = require('async');
const request = require('request');

const config = require('../config/config');
const LESession = require('./loginSession');
const AgentChat = require('./agentChat');


class Agent {
    constructor(account, userName, password) {
        this.account = account;
        this.userName = userName;
        this.password = password;
    }

    start() {
        console.log(`Login username = ${this.userName}`);
        this.session = new LESession(this.account, this.userName, this.password);
        async.series([
                callback => {
                this.session.start(callback);
            },
                callback => {
                this.session.login(callback);
            },
                callback => {
                this._loginAgent(callback);
            },
                callback => {
                this._setAvailability('Online', callback);
            }
        ], err => {
            if (err) {
                console.log('Error:' + err);
            }
            else {
                console.log('Agent checkForIncomingChats');
                this.checkForIncomingChats();
            }
        });
    }


    _loginAgent(callback) {
        const options = {
            method: 'POST',
            url: `https://${this.session.getCSDSDomain('agentVep')}/api/account/${this.account}/agentSession.json?v=1&NC=true`,
            headers: {
                AUTHORIZATION: `Bearer ${this.session.getBearer()}`
            },
            json: true,
            body: {
                loginData: {
                    userName: this.userName,
                    password: this.password
                }
            }
        };

        request(options, (error, response, body) => {
            if(error){
                const msg = `Agent login failed - ${JSON.stringify(error)}`;
                console.log(msg);
                callback(msg)
            }
            else if(response.statusCode < 200 || response.statusCode > 299){
                const msg = `Agent login failed - ${JSON.stringify(body)}`;
                console.log(msg);
                callback(msg)
            }
                this.requestURL = body.agentSessionLocation.link['@href'];
                console.log(`Agent login successfully. requestURL= ${this.requestURL}`);
                callback();

        });
    }

    _setAvailability(value, callback) {
        this.agentRequest(`PUT`, `availability`, {'availability': {'chat': value}}, err => {
            if (err) {
                callback(`Error Checking Agent Availability ${err.message}`);
            }
            else {
                console.log(`Agent Availability has been set: ${value}`);
                callback();
            }
        });
    }

    agentRequest(method, command, body, callback) {
        const options = {
            method: method,
            url: `${this.requestURL}/${command}.json?v=1&NC=true`,
            headers: {
                'Authorization': `Bearer ${this.session.getBearer()}`,
                'content-type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            json: true
        };
        if (body) {
            options.body = body;
        }
        if (method === 'PUT' || method === 'DELETE') {
            options.headers['X-HTTP-Method-Override'] = method;
            options.method = 'POST';
        }

        request(options, (error, response, body) => {
            if (error) {
                callback(`Agent Error in ${command}: ${JSON.stringify(error)}`);
            }
            else if(response.statusCode < 200 || response.statusCode > 299){
                callback(`Agent Error in ${command} body: ${JSON.stringify(body)}`);
            }

            callback(null, body, response);

        });
    }

    checkForIncomingChats() {
        this.agentRequest('GET', 'incomingRequests', null, (err, body) => {
            if (err) {
                console.log(`Check for incomingRequests error: ${JSON.stringify(err)}`);
            }
            else {
                if (body && body.incomingRequests && (body.incomingRequests.ringingCount > 0)) {
                    console.log('There is an incoming chat!');
                    const chatURL = body.incomingRequests.link['@href'];

                    if (chatURL) {
                        this.startChat(chatURL);
                    }
                }

                this.incomingTimer = setTimeout(() => {
                    this.checkForIncomingChats();
                }, 2000);
            }
        });
    }

    startChat(chatURL) {
        const chat = new AgentChat(this.session, chatURL);
        chat.start((err) => {
            if (err) {
                console.log(`Chat failed to start`);
            }
            else {
                console.log(`Chat started successfully`);
            }
        });
    }
}

module.exports = Agent;
