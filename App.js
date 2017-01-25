const agentBot = require('./lib/agentBot');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please enter account id: \n', (accountId) => {
    rl.question('Please enter agent user name: \n', (userName) => {
        rl.question('Please enter agent password: \n', (password) => {
            const agent = new agentBot(accountId, userName, password);

            rl.close();
            agent.start();
        });
    });
});