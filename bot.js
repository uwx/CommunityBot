'use strict';

const Discord = require('discord.js');
const fs = require('fs');

// LOAD CONFIG

try {
	require('./config.json');
} catch (e) {
	console.log("config.json not found. Copying from config-base.json...");
	fs.writeFileSync('./config.json', fs.readFileSync('./config-base.json'));
}
const config = require('./config.json');
const trigger = config.trigger;

// INITIALIZE BOT

let bot = new Discord.Client();
module.exports = bot;

const utility = require('./utility.js');

// ADD HANDLERS

const cmds = require('./cmd.js');
const commands = cmds.commands;

bot.on("ready", function () {
	console.log("Ready to begin! Serving in " + bot.channels.length + " channels.");
});

bot.on("disconnected", function () {
	console.log("Bot has disconnected. Exiting...");
	process.exit(0); //exit node.js without an error cuz CI will complain if we don't use valid credentials
});

bot.on("error", function (error) {
	console.log("Caught error: " + error);
});

bot.on("message", function (message) { // MAIN MESSAGE HANDLER
  if (cmds.r9kEnabled(message.channel)) { // r9k mode (deletes non-unique messages)
    cmds.r9k(message);
  }
  
	let msg = message.content;
	if (msg[0] === trigger) {
		let command = msg.toLowerCase().split(" ")[0].substring(1);
		let suffix = msg.substring(command.length + 2);
		if (commands[command]) { // original commands
			commands[command].process(message, suffix);
		} else if (utility.getCommands()[command]) { // custom commands registered through utility.js
			console.log('found ' + command);
      utility.getCommands()[command](message, suffix, bot); //bot is last, for cleans
		}
	}
});

const loadPlugins = require('./plugins.js');
if (config.plugins && config.plugins.length > 0) {
	const plugins = loadPlugins(config.plugins);
  
  for (let i in plugins) { // iterate through plugins
    if (plugins.hasOwnProperty(i)) {
      let plugin = plugins[i];
      
      for (let name in plugin.commands) { // iterate through commands
        if (plugin.hasOwnProperty(name)) {
          utility.registerCommand(name, plugin.commands[j].fn); // register
        }
      }
      
    }
  }
}
// load user commands from saved
if (config.customCommands) {
	for (let i of config.customCommands) {
		utility.registerEval(i.name, i.action);
	}
}

if (config.token)
  bot.loginWithToken(config.token); // login with token
else
  bot.login(config.email, config.password); // login with regular email/password
