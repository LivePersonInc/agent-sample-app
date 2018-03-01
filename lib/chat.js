'use strict';

const util = require('util');
const request = require('request');
const config = require('../config/config');
const transcript = require('../chats/transcript.json');
const StringHelper = require('../helpers/string');
const StructureContent = require('../structure_content/content');


class Chat {

  /**
   * Constructor
   * @param session - Session ID
   * @param chatURL - Chat URL
   * @param serviceURL - URL with Session Info - need for transfer Chat
   */
  constructor( session, chatURL, serviceURL ) {
    // Set Session
    this.session = session;
    // Set Chat URL
    this.chatURL = chatURL;
    // Set Service URL
    this.serviceURL = serviceURL;
    // Set Line
    this.lineIndex = 0;
    // Set Pinging Interval - Will Keep Agent In Chat
    this.chatPingInterval = 2000;
  }

  /**
   * Will return Next Link for Chat
   * @param linkArr
   * @returns {string | void | *}
   * @private
   */
  _getNextPingURL( linkArr ) {
    for (let i = 0; i < linkArr.length; i++) {
      const link = linkArr[i];
      if (link['@rel'] === 'next') {
        return link['@href'].replace('/events', '/events.json');
      }
    }
  }

  /**
   * Will get NextURL and Events from Request
   * @param data
   * @returns {{events: *, url: *}}
   * @private
   */
  _getEvents( data ) {
    // Events Holder
    let events;
    // URL Holder
    let nextURL;
    // Check if Chat is available and there are Events
    if (data.chat && data.chat.events) {
      // Set Next URL from Events
      nextURL = `${this._getNextPingURL(data.chat.events.link)}&v=1&NC=true`;
      // Set Events
      events = data.chat['events']['event'];
    } else {
      // Try-Chat Block
      try {
        // Set Next URL from Events
        nextURL = `${this._getNextPingURL(data.events.link)}&v=1&NC=true`;
      } catch (e) {
        // Log Error
        console.log(`Error getting the next URL link: ${e.message}, body=${JSON.stringify(data)}`);
        // Escape
        return;
      }
      // Set Events
      events = data['events']['event'];
    }
    // Events & Next URL for Chat
    return {
      events : events,
      url    : nextURL
    }
  }

  /**
   * Will Start new Chat Session
   * @param callback
   */
  start( callback ) {
    // Start Session
    this.startSession(( err, data ) => {
      // Check if any Errors while starting Session
      if (err) {
        // Trigger Callback
        callback(err);
      } else {
        // Trigger Callback
        callback(null);
        // Set Chat Link
        this.chatLink = data.chatLink;
        // Start Polling Chat
        this.polling();
      }
    });
  }

  /**
   * Will Stop Chat
   * @param callback
   */
  stop( callback ) {
    // Cleat Timeout
    clearTimeout(this.chatTimer);
    // Clear Incoming Timer
    clearTimeout(this.incomingTimer);
    // URL for Chat
    let url = `${this.chatLink}/events.json?v=1&NC=true`;
    // Authentication Bearer
    let bearer = `Bearer ${this.session.getBearer()}`;
    // Check if Chat Link Exist
    if (this.chatLink) {
      // Define Request Options
      const options = {
        method  : 'POST',
        url     : url,
        headers : {
          'Authorization'    : bearer,
          'content-type'     : 'application/json',
          'X-Requested-With' : 'XMLHttpRequest'
        },
        json    : true, // Body Type - JSON, if False needs to be XML
        body    : {
          event : {
            '@type' : 'state', // 'state','line'
            'state' : 'ended'
          }
        }
      };
      // Make Request
      request(options, ( error, response, body ) => {
        // Check if Errors while making request
        if (error) {
          // Error Message
          let error = `Error trying to end chat: ${JSON.stringify(error)}`;
          // Trigger Callback
          callback(error);
        } else if (response.statusCode < 200 || response.statusCode > 299) {
          // Error Message
          let error = `Error trying to end chat: ${JSON.stringify(body)}`;
          callback(error);
        } else {
          // Trigger Callback with Status Code
          callback(null, response.statusCode);
        }
        /*// Stop Session
        this.session.stop(err => {
          // Check if Errors while stopping Chat
          if (err) {
            // Trigger Callback
            callback(err);
          } else {
            // Trigger Callback - Success
            callback(null, response.statusCode);
          }
        });*/
      });
    } else {
      // Trigger Callback - Chat Link Unavailable
      callback(`Chat link is unavailable chatLink: ${this.chatLink}`);
    }
  }

  /**
   * Will calculate the Best Agent to Transfer Chat to
   * @param agents - Array of Agents
   * @returns {*} - Best Agent
   * @private
   */
  _calculateBestAvailableAgent( agents ) {
    //
    let agent = null;
    //
    let bestAvailability = 0;
    //
    console.log(`Number of Agents :: ${agents}`);
    if (agents.length !== undefined) {
      agents.forEach(( item ) => {
        // if Agent doesn't have Chats Key means Agent doesn't have a current Chat
        if (item.hasOwnProperty('chats')) {
          let availability = parseInt(item['@maxChats']) - parseInt(item['chats']);
          //
          if (bestAvailability > availability) {
            bestAvailability = availability;
            agent = item;
          }
        } else {
          bestAvailability = -1;
          // Set Agent
          agent = item;
        }
      });
    }
    //
    return agent;
  }

  /**
   * Will get list of Agents depending on Selected State ("Online", "Offline", "Occupied", "Away")
   * @param callback
   * @private
   */
  _getAvailableAgents( callback ) {
    // Service URL
    let url = `${this.serviceURL}/availableAgents`;
    // Define Chat State ("Online", "Offline", "Occupied", "Away")
    let chatState = 'Online';
    // Define Request Options
    const options = {
      // Method
      method  : 'GET',
      url     : `${url}.json?v=1&NC=true&chatState=${chatState}`, // URL for Request
      headers : {
        'Authorization'    : `Bearer ${this.session.getBearer()}`,
        'content-type'     : 'application/json',
        'X-Requested-With' : 'XMLHttpRequest'
      },
      json    : true,
    };
    // Make Request
    request(options, ( error, response, body ) => {
      // Check for Errors
      if (error) {
        // Log Error
        console.log(`Retrieving Available Agents Error: ${JSON.stringify(error)}`);
        // Trigger Callback
        callback(error,);
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        // Log Error
        console.log(`Error Retrieving Available Agents Body: ${JSON.stringify(body)}`);
        // Trigger Callback
        callback(null, body);
      }
      // Trigger Callback
      callback(null, body, response);
    });
  }

  /**
   * Will get Agent with Best Availability
   * @param callback
   * @private
   */
  _getAgentWithBestAvailability( callback ) {
    // Agents Holder
    let pool = null;
    // Get List of Online Agents
    this._getAvailableAgents(( error, response, body ) => {
      // Check for Errors
      if (!error && response !== null) {
        // Set Agents
        pool = response;
      }
      callback(this._calculateBestAvailableAgent(pool.availableAgents.agents.agent))
    });
  }

  /**
   * Will transfer a Chat to an Agent or Skill
   * if both Agent & Skill are present Agent takes precedent
   * @param agent - Agent Object
   * @param skill - Skill ID
   * @param callback - Callback Function
   */
  transfer( agent, skill, callback ) {
    // Define Body for Transfer
    let body = {
      transfer : {},
      text     : "I think this person needs some help from you."
    };
    // Check if Agent is available
    if (agent) {
      // Attach Agent ID to Body
      body.transfer = {
        agent : {
          id : agent['@id']
        }
      };
      // Check if Skill was pass
    } else if (skill) {
      // Attach Skill ID to Body
      body.transfer = {
        skill : {
          id : skill
        }
      };
    } else if ( agent && skill){
      // Attach Agent ID to Body
      body.transfer = {
        agent : {
          id : agent['@id']
        }
      };
    } else {
      // Trigger Callback - Chat Link Unavailable
      callback(`An Agent or Specific Skill ID is needed to Transfer a Chat`);
    }
    console.log(`Body :: ${JSON.stringify(body)}`);
    // URL for Chat
    let url = `${this.chatLink}/transfer.json?v=1&NC=true`;
    // Authentication Bearer
    let bearer = `Bearer ${this.session.getBearer()}`;
    // Check if Chat Link Exist
    if (this.chatLink) {
      // Define Request Options
      const options = {
        method  : 'POST',
        url     : url,
        headers : {
          'Authorization'    : bearer,
          'content-type'     : 'application/json',
          'X-Requested-With' : 'XMLHttpRequest'
        },
        json    : true, // Body Type - JSON, if False needs to be XML
        body    : body
      };
      // Make Request
      request(options, ( error, response, body ) => {
        // Check if Errors while making request
        if (error) {
          // Error Message
          let error = `Error trying to transfer chat: ${JSON.stringify(error)}`;
          // Trigger Callback
          callback(error);
        } else if (response.statusCode < 200 || response.statusCode > 299) {
          // Error Message
          let error = `Error trying to transfer chat: ${JSON.stringify(body)}`;
          callback(error);
        }
        //
        console.log(`Transfer Status :: ${response.statusCode}`);
        // Trigger Callback - Chat Link Unavailable
        callback(null, body);
      });
    } else {
      // Trigger Callback - Chat Link Unavailable
      callback(`Chat link is unavailable chatLink: ${this.chatLink}`);
    }
  }

  /**
   * (Wrapper) Will Start new Chat Session
   * @param callback
   */
  startSession( callback ) {
    // URL
    let url = `${this.chatURL}.json?v=1&NC=true`;
    // Bearer
    let bearer = `Bearer ${this.session.getBearer()}`;
    // Define Request Options
    const options = {
      // Method
      method  : 'POST', // URL for Request
      url     : url, // Headers
      headers : {
        'Authorization'    : bearer,
        'content-type'     : 'application/json',
        'Accept'           : 'application/json',
        'X-Requested-With' : 'XMLHttpRequest'
      }, // Body Type - JSON, if False needs to be XML
      json    : true, // Body
      body    : { 'chat' : 'start' }
    };
    // Make Request
    request(options, ( error, response, body ) => {
      // Check if Errors
      if (error) {
        // Trigger Callback
        callback(`Failed to start chat session with error: ${JSON.stringify(error)}`);
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        // Trigger Callback
        callback(`Failed o start chat session with error: ${JSON.stringify(body)}`);
      }
      // Log
      console.log(`Start chat session - body: ${body.chatLocation.link['@href']}`);
      // Trigger Callback
      callback(null, {
        chatLink : body.chatLocation.link['@href']
      });
    });
  }

  /**
   * Will start Polling Chat Events from given Chat URL
   * @param url
   */
  polling( url ) {
    // Check if Chat URL is Available
    if (!url) {
      // Set Chat URL if no URL was set
      url = this.chatLink + '.json?v=1&NC=true'
    }
    console.log(`URL :: ${url}`);
    // Define Request Options
    const options = {
      method  : 'GET',
      url     : url,
      headers : {
        'Authorization'    : `Bearer ${this.session.getBearer()}`,
        'content-type'     : 'application/json',
        'X-Requested-With' : 'XMLHttpRequest'
      },
      json    : true // Body Type - JSON, if False needs to be XML
    };
    // Make Request
    request(options, ( error, response, body ) => {
      // Check if any Errors while polling Chat
      if (error) {
        // Log Error
        console.error(`Agent polling failed. Error: ${JSON.stringify(error)}`);
        // Escape
        return;
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        // Log - Status not expected
        console.error(`Agent polling failed. body: ${JSON.stringify(body)}`);
        // Escape
        return;
      }
      // Check if Chat is available and there are no Errors
      if (body.chat && body.chat.error) {
        // Log Error
        console.log(`Chat error: ${JSON.stringify(body.chat.error)}`);
        // Escape
        return;
      }
      // Get Events & URL from Body
      let data = this._getEvents(body);
      // Set Events
      let events = data.events;
      // Set Next URL from Ping
      let nextURL = data.url;
      // Manage Bot Responding to Chat
      this.manage(events);
      // Set new Chat Timeout Function
      this.chatTimer = setTimeout(() => {
        // Set Polling for Next URL
        this.polling(nextURL);
      }, this.chatPingInterval);
    });
  }

  /**
   * Will manage Bot responding chat if Events are valid.
   * @param events - Chat Events
   */
  manage( events ) {
    // Check if any Events
    if (events) {
      // The API send an object and not an array if there is 1 event only
      if (!Array.isArray(events)) {
        // Get Events if not and Array
        events = [events];
      }
      // Iterate Events
      for (let i = 0; i < events.length; i++) {
        // Get Event
        const ev = events[i];
        // Check if the Conversation is over
        if ((ev['@type'] === 'state') && (ev.state === 'ended')) {
          // Escape
          return;
        } else if ((ev['@type'] === 'line') && (ev['source'] === 'visitor')) {
          // Log Visitor Line
          console.log(`(chatPolling) - line form visitor: ${ev.text}`);
          if (StringHelper.compare('appointment', ev.text)) {
            //
            this.sendContent(StructureContent.newAppointment);
          } else if (StringHelper.compare('day', ev.text)) {
            //
            this.sendContent(StructureContent.day);
          } else if (StringHelper.compare('Monday Tuesday Wednesday Thursday Friday', ev.text)) {
            //
            this.sendContent(StructureContent.hour);
          } else if (StringHelper.compare('complex', ev.text)) {
            // Send Example with Complex Structure Content Template
            this.sendContent(StructureContent.complexContent);
          } else if (StringHelper.compare('simple', ev.text)) {
            // Send Example with Simple Structure Content Template
            this.sendContent(StructureContent.simple);
          } else if (StringHelper.compare('transfer', ev.text)) {
            // Will Get Best Agent to Transfer
            this._getAgentWithBestAvailability(( agent ) => {
              if (agent){
                // Transfer Chat
                this.transfer(agent, null,( info ) => {
                  // Log
                  console.log(`Status :: ${info}`);
                });
              } else {
                // Send No Available Agents
                this.sendLine("Sorry for the moment there aren't any available Agents to transfer you")
              }
            });
          } else if(StringHelper.compare('stop', ev.text)) {
            // Close Chat
            this.stop((error, statusCode) => {
              // Check for Errors
              if (error){
                // Log Error
                console.log(`Ending Chat Error :: ${error}`);
              } else {
                // Log Status
                console.log(`Chat Status Code :: ${statusCode}`);
              }
            });
          } else {
            // Send Regular Line
            this.sendLine();
          }
        }
      }
    }
  }

  /**
   * Will send a single line to the Chat
   * @param newline
   */
  sendLine( newline ) {
    // Set Line - if there is no line, it will use line from transcript
    let line = (newline == null) ? transcript[this.lineIndex] : newline;
    // Check if Line is not null
    if (!line) {
      // Stop Chat
      this.stop(err => {
        // Check if any Errors stopping chat
        if (err) {
          // Log Error
          console.log(`Error stopping chat err: ${err.message}`);
        }
      });
      // Escape
      return;
    }
    // URL for Chat
    let url = `${this.chatLink}/events.json?v=1&NC=true`;
    // Authentication Bearer
    let bearer = `Bearer ${this.session.getBearer()}`;
    // Define Request Options
    const options = {
      // Method
      method  : 'POST', // URL for Request
      url     : url, // Set Headers
      headers : {
        'Authorization'    : bearer,
        'content-type'     : 'application/json',
        'X-Requested-With' : 'XMLHttpRequest'
      }, // Body Type - JSON, if False needs to be XML
      json    : true, // Attach Body to Request
      body    : {
        event : {
          '@type'    : 'line', //'state','line'
          'text'     : `<p dir='ltr' style='direction: ltr; text-align: left;'>${line}</p>`,
          'textType' : 'html'
        }
      }
    };
    // Set Timeout to Make Request
    setTimeout(() => {
      // Make Request
      request(options, ( error, response, body ) => {
        // Increment Line Index
        this.lineIndex++;
        // Check if any errors while sending new Line
        if (error) {
          // Log Error
          console.log(`Error sending line. Error: ${JSON.stringify(error)}`);
        } else if (response.statusCode < 200 || response.statusCode > 299) {
          // Log - Not Expected Code
          console.log(`Error sending line. Body: ${JSON.stringify(body)}`);

        }
        // Log Body Request
        console.log(`Send line: ${JSON.stringify(body)}`);
      });
    }, config.chat.minLineWaitTime);
  }

  /**
   * Will send Structure Content to Chat
   * @param content - JSON for SC
   */
  sendContent( content ) {
    // URL for Chat
    let url = `${this.chatLink}/events.json?v=1&NC=true`;
    // Authentication Bearer
    let bearer = `Bearer ${this.session.getBearer()}`;
    // Log Structure Content
    console.log(`Structure Content: ${JSON.stringify(content)}`);
    // TODO: @type value can be: 'state','line'
    // Define Request Options
    const options = {
      method  : 'POST',
      url     : url,
      headers : {
        'Authorization'    : bearer,
        'content-type'     : 'application/json',
        'X-Requested-With' : 'XMLHttpRequest'
      },
      json    : true,
      body    : {
        "event" : {
          "@type"    : "line",
          "textType" : "rich-content",
          "json"     : content
        }
      }
    };
    // Set Timeout to Make Request
    setTimeout(() => {
      // Make Request
      request(options, ( error, response, body ) => {
        // Increment Line Index
        this.lineIndex++;
        // Check if any errors while sending new Line
        if (error) {
          // Log Error
          console.log(`Error sending structure content. Error: ${JSON.stringify(error)}`);
        } else if (response.statusCode < 200 || response.statusCode > 299) {
          // Log - Not Expected Code
          console.log(`Error sending structure content. Body: ${JSON.stringify(body)}`);
        }
        // Log Body Request
        console.log(`Send line: ${JSON.stringify(body)}`);
      });
    }, config.chat.minLineWaitTime);
  }
}

module.exports = Chat;
