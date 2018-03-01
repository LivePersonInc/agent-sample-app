'use strict';
// Import Async Module
const async = require('async');
// Import Request Module
const request = require('request');
// Import Configuration
const config = require('../config/config');
// Import LiveEngage Session Class
const LESession = require('./loginSession');
// Import Chat Class
const Chat = require('./chat');

class Agent {

  /**
   * Constructor
   */
  constructor() {
    // LE Account
    this.account = config.support;
    // Bot User
    this.userName = config.users.bastion.username;
    // Bot Password
    this.password = config.users.bastion.password;
  }

  /**
   * Will make requests on behalf on the Agent (Change Availability/Check for Incoming Chats)
   * @param method PUT/GET/POST
   * @param command
   * @param body
   * @param callback
   */
  makeRequest( method, command, body, callback ) {
    // Define Request Options
    const options = {
      // Method
      method  : method,
      // URL for Request
      url     : `${this.requestURL}/${command}.json?v=1&NC=true`,
      headers : {
        'Authorization'    : `Bearer ${this.session.getBearer()}`,
        'content-type'     : 'application/json',
        'X-Requested-With' : 'XMLHttpRequest'
      },
      json    : true
    };
    // Check if there is a Body to attach
    if (body) {
      // Attach Body to to options
      options.body = body;
    }
    // Check if method should be POST
    if (method === 'PUT' || method === 'DELETE') {
      // Set Post Headers
      options.headers['X-HTTP-Method-Override'] = method;
      // Set Method
      options.method = 'POST';
    }
    // Make Request
    request(options, ( error, response, body ) => {
      // Check for Errors
      if (error) {
        // Trigger Callback
        callback(`Agent Error in ${command}: ${JSON.stringify(error)}`);
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        // Trigger Callback
        callback(`Agent Error in ${command} body: ${JSON.stringify(body)}`);
      }
      // Trigger Callback
      callback(null, body, response);
    });
  }

  /**
   * Will Start Agent
   */
  start() {
    // Log Agent Username
    console.log(`Login username = ${this.userName}`);
    // Create new Session with Credentials
    this.session = new LESession(this.account, this.userName, this.password);
    // Set Callbacks
    async.series([callback => {
      // Start Session
      this.session.start(callback);
    }, callback => {
      // Login Session
      this.session.login(callback);
    }, callback => {
      // Login Agent
      this._login(callback);
    }, callback => {
      // Check Availability
      this._setAvailability('Online', callback);
    }], err => {
      if (err) {
        // Log Error
        console.log('Error:' + err);
      } else {
        // Log State
        console.log('Agent checkForIncomingChats');
        // Start Checking for Incoming Chats
        this.checkForIncomingChats();
      }
    });
  }

  /**
   * Will Start a new Chat for given URL
   * @param chatURL
   */
  startChat( chatURL ) {
    // Create new Agent for Current Session and Chat
    const chat = new Chat(this.session, chatURL, this.requestURL);
    // Start new Chat
    chat.start(( error ) => {
      // Check if any Errors while starting Chat
      if (error) {
        // Log Error
        console.log(`Chat failed to start ${JSON.stringify(error)}`);
      } else {
        console.log(`Chat started successfully`);
      }
    });
  }

  /**
   * Will login an Agent
   * @param callback - Callback Function
   * @private
   */
  _login( callback ) {
    // Define Service URL
    let url = `https://${this.session.getCSDSDomain('agentVep')}/api/account/${this.account}/agentSession.json?v=1&NC=true`;
    // Define Request Body
    let body = {
      // Login Data JSON
      loginData : {
        userName : this.userName, // User Name
        password : this.password  // Password
      }
    };
    // Define Request Options
    const options = {
      // Method
      method  : 'POST',
      url     : url, // URL for Request
      headers : {
        // Set Authorization Bearer
        AUTHORIZATION : `Bearer ${this.session.getBearer()}`
      },
      json    : true, // Body Type - JSON, if False needs to be XML
      body    : body  // Attach Body to Request
    };
    // Make Request
    request(options, ( error, response, body ) => {
      // Check if Errors while making request
      if (error) {
        // Error Message
        const msg = `Agent login failed - ${JSON.stringify(error)}`;
        // Trigger Callback
        callback(msg)
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        // Error Message
        const msg = `Agent login failed - ${JSON.stringify(body)}`;
        // Trigger Callback
        callback(msg)
      }
      // Request Succeed
      this.requestURL = body.agentSessionLocation.link['@href'];
      console.log(`Agent login successfully. requestURL= ${this.requestURL}`);
      callback();
    });
  }

  /**
   * Will Set/Change Agent Availability
   * @param value -
   *  "Online" - Agents can accept chat requests,
   *  "Away" - Agents cannot accept chat requests,
   *  "Occupied" - Agents can receive chats that were transferred to them
   * @param callback
   * @private
   */
  _setAvailability( value, callback ) {
    // Make Request
    this.makeRequest('PUT', 'availability', { 'availability' : { 'chat' : value } }, err => {
      // Check if Errors
      if (err) {
        // Trigger Callback
        callback(`Error Checking Agent Availability ${err.message}`);
      } else {
        // Trigger Callback
        callback();
      }
    });
  }

  /**
   * Will return the Agent's Availability to Accept Chat Requests.
   * @param callback ("chat": "Online/Away/Occupied", "voice": "Offline/Online")
   * @private
   */
  _getAvailability ( callback ){
    // Make Request to fetch Availability Status
    this.makeRequest('GET','availability',null, (err,body) =>{
      // Check if any Errors
      if (err) {
        // Log Error
        console.log(`Get Availability Error :: ${JSON.stringify(err)}`);
        // Trigger Callback - Error
        callback(err);
      } else {
        // Check if availability is on body
          if (body.hasOwnProperty('availability')){
            // Trigger Callback - Availability
            callback(body.availability);
          } else {
            // Trigger Callback - null
            callback();
          }
      }
    });
  }

  /**
   * Will check for Incoming Chats (New Chats)
   */
  checkForIncomingChats() {
    // Make Request
    this.makeRequest('GET', 'incomingRequests', null, ( err, body ) => {
      // LOG Error
      console.log(`Error :: ${err}`);
      //
      console.log(`Body :: ${JSON.stringify(body)}`);
      // Check if any Errors
      if (err) {
        // Log Error
        console.log(`Check for incomingRequests error: ${JSON.stringify(err)}`);
      } else {
        // Check if there is an Incoming request or an Ring > 0
        if (body && body.incomingRequests && (body.incomingRequests.ringingCount > 0)) {
          // Log - Incoming Chat
          console.log('There is an incoming chat!');
          // Get Request URL
          const chatURL = body.incomingRequests.link['@href'];
          // URL exist
          if (chatURL) {
            // Start New Chat
            this.startChat(chatURL);
          }
        }
        // Set Timeout Function to Check for Incoming Chats Regularly
        this.incomingTimer = setTimeout(() => {
            // Set Function for as Timeout
            this.checkForIncomingChats();
          }, // Set Interval
          2000);
      }
    });
  }

}
// Expose Class
module.exports = Agent;
