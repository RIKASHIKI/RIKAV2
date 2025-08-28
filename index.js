/**
 * RIKA WhatsApp Multi Device Bot
 * Main entry point
 */

const { spawn } = require('child_process');
const path = require('path');

function start(file) {
    let args = [path.join(__dirname, file), ...process.argv.slice(2)];
    console.log([process.argv[0], ...args].join(' '));
    
    let p = spawn(process.argv[0], args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    });
    
    p.on('message', data => {
        console.log('[RECEIVED]', data);
        switch (data) {
            case 'reset':
                p.process.kill();
                start.apply(this, arguments);
                break;
            case 'uptime':
                p.send(process.uptime());
                break;
        }
    });
    
    p.on('exit', (_, code) => {
        if (code !== 0) return start(file);
        console.error('Exited with code:', code);
    });
    
    let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
    if (!opts['test'])
        if (!rl.listenerCount()) rl.on('line', line => {
            p.emit('message', line.trim());
        });
}

const yargs = require('yargs/yargs');
const rl = require('readline').createInterface(process.stdin, process.stdout);

start('RIKASHIKI.js');
