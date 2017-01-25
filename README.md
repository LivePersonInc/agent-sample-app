Agent sample app 
================
Agent simulator app.
This is a virtual agent simulator build over the agent API.
In this demo the simulator implements the following Agent API endpoints:
 - LiveEngage login
 - LiveEngage session refresh
 - Set availability to Online
 - Create Agent session
 - Check for incoming chats
 - Accept chat invitation and start chat session (if there is a chat waiting in queue)
 - Chat polling (wait to get messages from visitor)
 - Send line
 - End the chat when the transcript is over.

Prerequisite
============
- Create LiveEngage site
- Make sure to have a user for this simulator(you will need a username and password)

Installation
============
- Run npm install 

Getting Started
===============
1. Run npm start
2. Enter account id
3. Enter agent username
4. Enter agent password
5. Go to [visitor test page](https://livepersoninc.github.io/visitor-page/?siteid=SiteId), enter your site id in the url and refresh the page 
6. Click to start chat
7. Send the first message as a visitor 
8. Wait for the agent response
9. Follow 7,8 steps until the simulator ends the conversation
