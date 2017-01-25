"use strict";

const request = require("request");
const urlParser = require("url");
const util = require("util");
const config = require("../config/config");


class LESession {
    constructor(account, userName, password) {
        this.cookieJar = request.jar();
        this.account = account;
        this.username = userName;
        this.password = password;
    }

    getBearer() {
        return this.info && this.info.bearer;
    }

    getCSRF() {
        return this.info && this.info.csrf;
    }

    getCSDSDomain(service) {
        return this.csdsMap && this.csdsMap[service];
    }

    start(cb) {
        this._getCSDSLoginDomain((err, domain)=> {
            if (err) {
                console.log(`Failed to receive the login domain: ${JSON.stringify(err)}`);
                cb(err);
                return;
            }
            this.domain = domain;
            cb(null, domain);
        });

    }

    login(cb) {
        const url = `https://${this.domain}/api/account/${this.account}/login?v=1.2`;
        const options = {
            method: 'POST',
            url: url,
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            },
            jar: this.cookieJar,
            json: true,
            body: {"username": this.username, "password": this.password}
        };
        request(options, (err, httpResponse, body) => {
            if (err || 200 > httpResponse.statusCode || httpResponse.statusCode > 299) {
                cb(err);
                return;
            }
            this.info = body;

            this.csdsMap = _parseCSDSInfo(body.csdsCollectionResponse);
            this.refreshTimer = setTimeout(() => {
                this._refreshSession();
            }, config.lesession.refreshDelay);
            cb(null, body);
        });
    }

    _refreshSession() {
        const url = `https://${this.domain}/api/account/${this.account}/refresh?v=1.2`;
        const options = {
            url: url,
            method: "POST",
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            },
            jar: this.cookieJar,
            json: true,
            body: {"csrf": this.getCSRF()}
        };
        request(options, (err, httpResponse, body) => {
            this.refreshTimer = setTimeout(() => {
                this._refreshSession();
            }, config.lesession.refreshDelay);

            if (err || 200 > httpResponse.statusCode || httpResponse.statusCode > 299) {
                console.error(`Error refreshing session error: ${JSON.stringify(err)}`);
            }
        });
    }

    stop(cb) {
        clearTimeout(this.refreshTimer);
        const url = `https://${this.domain}/api/account/${this.account}/logout?v=1.2`;
        const options = {
            url: url,
            method: "POST",
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            },
            jar: this.cookieJar,
            json: true,
            body: {"csrf": this.getCSRF()}
        };
        request(options, (err, httpResponse, body) => {
            if (err || 200 > httpResponse.statusCode || httpResponse.statusCode > 299) {
                cb(err);
                return;
            }
            cb(null, body);
        });
    }

    _getCSDSLoginDomain(cb) {
        const url = `${config.lesession.csdsDomain}/csdr/account/${this.account}/service/agentVep/baseURI.json?version=1.0`;
        const options = {
            method: "GET",
            uri: url
        };
        request(options, (err, response, body) => {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, JSON.parse(body).baseURI);
            }
        );
    }
}

function _parseCSDSInfo(collection) {
    let csdsMap = {};
    let baseURIs = collection.baseURIs;
    for (let i = 0; i < baseURIs.length; i++) {
        csdsMap[baseURIs[i].service] = baseURIs[i].baseURI;
    }
    return csdsMap;
}


module.exports = LESession;
