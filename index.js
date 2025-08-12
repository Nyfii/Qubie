import { Client, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { startServer, stopServer, sendCommand, getLog, getWhitelist, getPlayerInfo } from './mc.js'

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

dotenv.config()

const messages = {
    "help": loadRespnoseFile("help"),
    "serverstarterr": loadRespnoseFile("serverstarterr"),
    "serverstartperm": loadRespnoseFile("serverstartperm"),
    "serverstartsucc": loadRespnoseFile("serverstartsucc"),
}

let privs1 = []
const rawPrivs1 = readFileSync('./priv1.txt', 'utf-8')
privs1 = rawPrivs1.split('\n').map(id => id.trim()).filter(id => id.length > 0)


let privs2 = []
const rawPrivs2 = readFileSync('./priv2.txt', 'utf-8')
privs2 = rawPrivs2.split('\n').map(id => id.trim()).filter(id => id.length > 0)


// --------------------------------------------------

const PREFIX = '-qb';

client.once('ready', () => {
    console.log(`Qubie is online as ${client.user.tag}`);
})

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        message.channel.send(messages.help);
        return;
    }

    if (command === 'serverstart') {
        if (!hasPriv1(message.author.id)) {
            message.channel.send(replaceCharactersInResponseMessage(messages.serverstartperm, message.author.username));
            return;
        }
        if (startServer()) {
            message.channel.send(replaceCharactersInResponseMessage(messages.serverstartsucc, message.author.username));
        } else {
            message.channel.send(replaceCharactersInResponseMessage(messages.serverstarterr, message.author.username));
        }
    }

    if (command === 'serverstop') {
        if (!hasPriv1(message.author.id)) {
            message.channel.send('No');
            return;
        }
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
        if (!hasPriv2(message.author.id)) {
            message.channel.send('No');
            return;
        }
        const username = removeRiskyCharacters(args[0]);
        if (!isValidName(username)) return;
        if (sendCommand(`whitelist remove ${username}`)) {
            message.channel.send('ok');
        } else {
            message.channel.send('nope');
        }
    }

    if (command === 'whitelistlist') {
        if (!hasPriv2(message.author.id)) {
            message.channel.send('No');
            return;
        }
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

function replaceCharactersInResponseMessage(message, userName) {
    return message.replace('{{ Username }}', userName);
}

function loadRespnoseFile(name) {
    return readFileSync(`./messages/${name}.txt`, 'utf-8')
}

function removeRiskyCharacters(input) {
    return input.replace(/[<>@`]/g, '');
}

function isValidName(input) {
    return /^[a-zA-Z0-9_]{3,16}$/.test(input);
}

function hasPriv1(userId) {
    return privs1.includes(userId)
}

function hasPriv2(userId) {
    return privs2.includes(userId);
}

client.login(process.env.DISCORD_TOKEN);


