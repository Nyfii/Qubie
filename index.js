import { Client, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { startServer, stopServer, sendCommand, getLog, getWhitelist, getPlayerInfo } from './mc.js'

const messages = {
    "help": readFileSync('./messages/help.txt', 'utf-8')
}

dotenv.config()

let adminIDs = []

try {
    const raw = readFileSync('./admins.txt', 'utf-8')
    adminIDs = raw.split('\n').map(id => id.trim()).filter(id => id.length > 0)
} catch (err) {
    console.error('❌ Failed to load admin list:', err)
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
})

const PREFIX = '-qb';

client.once('ready', () => {
    console.log(`🟢 Qubie is online as ${client.user.tag}`);
})

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        message.channel.send(messages.help);
    }

    if (command === 'serverstart') {
        if (startServer()) {
            message.channel.send('Starting Server');
        } else {
            message.channel.send('Server is already running');
        }
    }

    if (command === 'serverstop') {
        if (stopServer()) {
            message.channel.send('Stopping Server');
        } else {
            message.channel.send('Server is already stopped');
        }
    }

    if (command === 'whitelist') {
        const username = removeRiskyCharacters(args[0]);
        if (!isValidName(username)) return;
        if (sendCommand(`whitelist add ${username}`)) {
            message.channel.send('ok');
        } else {
            message.channel.send('nope');
        }
    }

    if (command === 'rmwhitelist') {
        const username = removeRiskyCharacters(args[0]);
        if (!isValidName(username)) return;
        if (sendCommand(`whitelist remove ${username}`)) {
            message.channel.send('ok');
        } else {
            message.channel.send('nope');
        }
    }

    if (command === 'whitelistlist') {
        const whitelist = getWhitelist();
        if (whitelist.length === 0) {
            message.channel.send('Whitelist is currently empty.');
            return;
        }
        const formatted = whitelist.map((entry, i) => `${i + 1}. ${entry.name}`).join('\n');
        message.channel.send(`**Whitelisted Players (${whitelist.length})**:\n` + '```' + formatted + '```')
    }

    if (command === 'log') {
        const logText = getLog().map((msg, i) => `${i + 1}. ${msg}`).join('\n')
        message.channel.send('**Last 10 log messages:**\n' + '```' + logText + '```')
    }

    if (command === 'status') {
        sendCommand('list')
        setTimeout(() => {
            message.channel.send(getPlayerInfo());
        }, 1000);
    }
});

function removeRiskyCharacters(input) {
    return input.replace(/[<>@`]/g, '');
}

function isValidName(input) {
    return /^[a-zA-Z0-9_]{3,16}$/.test(input);
}

function isAdmin(userId) {
    return adminIDs.includes(userId)
}

client.login(process.env.DISCORD_TOKEN);


