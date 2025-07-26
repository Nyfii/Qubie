import { spawn } from 'child_process';
import fs from 'fs';

let mcProcess = null
let latestPlayerInfo = 'No Players :(';

const messageLog = []

export function startServer() {
    if (mcProcess) {
        console.log('[MC] Server already running')
        return false
    }

    mcProcess = spawn('sh', ['run.sh'], {
        cwd: './minecraft_server',
        stdio: ['pipe', 'pipe', 'pipe']
    })

    mcProcess.stdout.on('data', (data) => {
        const output = `[MC stdout] ${data}`;
        if (data.includes('There are')) {
            latestPlayerInfo = data.toString();
        }
        addToLog(output);
        console.log(output);
    })

    mcProcess.stderr.on('data', (data) => {
        const output = `[MC stderr] ${data}`;
        addToLog(output);
        console.error(output);
    })

    mcProcess.on('close', (code) => {
        const output = `[MC] exited with code ${code}`;
        addToLog(output);
        console.log(output);
        mcProcess = null;
    })

    return true;
}

export function stopServer() {
    if (!isServerRunning()) return false;
    mcProcess.stdin.write('stop\n');
    return true;
}

export function isServerRunning() {
    return mcProcess !== null;
}

export function sendCommand(command) {
    if (!isServerRunning()) return false;
    mcProcess.stdin.write(`${command}\n`);
    return true;
}

export function getLog() {
    return messageLog;
}

export function getWhitelist() {
    try {
        return JSON.parse(fs.readFileSync('./minecraft_server/whitelist.json'));
    } catch (err) {
        return 'Error fetching the whitelist';
    }
}

export function getPlayerInfo() {
    return latestPlayerInfo;
}

function addToLog(message) {
    messageLog.push(message);
    if (messageLog.length > 10) messageLog.shift();
}
