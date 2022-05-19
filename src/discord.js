const { Client, Intents } = require('discord.js'); //import discord.js

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }) //create new client
client.login(process.env.DISCORD_TOKEN); //login bot using token
const {channelIds} = require('./collections')

const sendDiscordUpdate = (channel,update) =>{ 
    client.channels.fetch(channelIds[channel])
        .then(channel => channel.send(update))
}

module.exports={
    sendDiscordUpdate
}


