/**
 * RIKA WhatsApp Multi Device Bot
 * Main entry point
 */

const { spawn } = require('child_process');
const path = require('path');

async function start(file) {
    const { default: yargs } = await import('yargs');
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

const rl = require('readline').createInterface(process.stdin, process.stdout);



// Watcher untuk notifikasi penambahan baris kode
const fs = require('fs');
const filesToWatch = [path.join(__dirname, 'RIKASHIKI.js'), path.join(__dirname, 'index.js')];
let lastLineCounts = {};

filesToWatch.forEach(file => {
    lastLineCounts[file] = fs.readFileSync(file, 'utf-8').split('\n').length;
    fs.watchFile(file, { interval: 1000 }, (curr, prev) => {
        const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
        if (lines > lastLineCounts[file]) {
            console.log(`📢 File ${path.basename(file)} bertambah ${lines - lastLineCounts[file]} baris kode!`);
        }
        lastLineCounts[file] = lines;
    });
});

(async () => {
    await start('RIKASHIKI.js');
})();
