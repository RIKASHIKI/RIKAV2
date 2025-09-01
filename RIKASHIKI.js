/**
 * RIKA WhatsApp Multi Device Bot
 * Main bot file
 */

require('./config');
const { default: WASocket, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, jidDecode, proto } = require("@whiskeysockets/baileys");
const serialize = require("./lib/serialize");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const P = require('pino');
const config = require('./config');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
const { smsg, isUrl, generateMessageTag, getBuffer, fetchJson, sleep } = require('./lib/myfunc');
const express = require('express');
const qrcode = require('qrcode-terminal');

// Simple store replacement
const store = {
    messages: {},
    contacts: {},
    bind: (ev) => {
        ev.on('messages.upsert', ({ messages }) => {
            for (const msg of messages) {
                if (msg.key && msg.key.id) {
                    store.messages[msg.key.id] = msg;
                }
            }
        });
    },
    loadMessage: async (jid, id) => {
        return store.messages[id] || null;
    }
};

// Express server for QR code display
const app = express();
const PORT = process.env.PORT || 8082;

let qrString = '';
let retryCount = 0;
const maxRetries = 3;

app.get('/', (req, res) => {
    if (qrString) {
        res.send(`
            <html>
                <head>
                    <title>RIKA Bot QR Code</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                        .qr-container { margin: 20px auto; padding: 20px; max-width: 400px; }
                        .status { color: #666; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <h1>RIKA WhatsApp Bot</h1>
                    <div class="status">Scan the QR code below with WhatsApp</div>
                    <div class="qr-container">
                        <div id="qrcode"></div>
                    </div>
                    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
                    <script>
                        setTimeout(() => {
                            if (typeof QRCode !== 'undefined') {
                                QRCode.toCanvas(document.getElementById('qrcode'), '${qrString}', function (error) {
                                    if (error) console.error(error);
                                    console.log('QR code generated successfully!');
                                });
                            } else {
                                // Fallback: show QR text if library fails to load
                                document.getElementById('qrcode').innerHTML = '<pre style="font-size: 8px; line-height: 8px;">${qrString}</pre>';
                            }
                        }, 1000);
                    </script>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <head>
                    <title>RIKA Bot Status</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                        .status { color: #666; }
                    </style>
                </head>
                <body>
                    <h1>RIKA WhatsApp Bot</h1>
                    <div class="status">Bot is starting or already connected...</div>
                </body>
            </html>
        `);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`QR Code server running on http://0.0.0.0:${PORT}`);
});

async function startRika() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
    
    // Initialize authentication state
    await serialize.init();
    
    const sock = WASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['RIKA Bot', 'Safari', '1.0.0'],
        auth: serialize.state
    });

    store.bind(sock.ev);

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            console.log('📥 Message received, processing...');
            const mek = chatUpdate.messages[0];
            if (!mek.message) {
                console.log('❌ No message content found');
                return;
            }
            
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                console.log('⏭️ Skipping status broadcast');
                return;
            }
            
            // Set bot to public mode for now to receive all messages
            sock.public = true;
            
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) {
                console.log('⏭️ Skipping Baileys message');
                return;
            }
            
            console.log('✅ Processing message from:', mek.key.remoteJid);
            const m = smsg(sock, mek, store);
            require('./src/handler')(sock, m, chatUpdate, store);
        } catch (err) {
            console.log('❌ Error processing message:', err);
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrString = qr;
            console.log('QR Code received, scan with WhatsApp');
            qrcode.generate(qr, { small: true });
            console.log(`QR Code also available at: http://localhost:${PORT}`);
        }
        
        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log('Connection closed due to ', lastDisconnect?.error?.message || 'Unknown error');
            
            // Handle specific disconnect reasons
            if (statusCode === DisconnectReason.connectionClosed) {
                console.log('Connection was closed, reconnecting...');
            } else if (statusCode === DisconnectReason.connectionLost) {
                console.log('Connection was lost, reconnecting...');
            } else if (statusCode === DisconnectReason.restartRequired) {
                console.log('Restart required, restarting...');
            } else if (statusCode === 440) { // Stream conflict
                retryCount++;
                console.log('Stream conflict detected - another device may be connected');
                console.log(`Retry attempt: ${retryCount}/${maxRetries}`);
                
                if (retryCount >= maxRetries) {
                    console.log('❌ Maximum retry attempts reached!');
                    console.log('📱 SOLUTION: Please check your WhatsApp and disconnect other linked devices:');
                    console.log('   1. Open WhatsApp on your phone');
                    console.log('   2. Go to Settings > Linked Devices');
                    console.log('   3. Disconnect all other devices');
                    console.log('   4. Restart this bot to get a new QR code');
                    console.log('⏸️  Bot stopped to prevent infinite loops.');
                    return; // Stop trying to reconnect
                }
                
                console.log('Clearing session and waiting before reconnect...');
                qrString = '';
                await sleep(15000); // Wait 15 seconds before reconnecting
            }
            
            if (shouldReconnect && retryCount < maxRetries) {
                const delay = statusCode === 440 ? 15000 : 3000; // Longer delay for conflicts
                console.log(`Reconnecting in ${delay/1000} seconds...`);
                setTimeout(() => startRika(), delay);
            }
        } else if (connection === 'open') {
            qrString = '';
            retryCount = 0; // Reset retry count on successful connection
            console.log('✅ WhatsApp connection opened successfully!');
            console.log('🤖 Bot is now ready to receive messages');
            console.log('📱 Send a message to test the bot connection');
        }
    });

    sock.ev.on('creds.update', serialize.saveState);

    // Handle group updates
    sock.ev.on('groups.upsert', console.log);
    sock.ev.on('group-participants.update', async (anu) => {
        console.log(anu);
        try {
            let metadata = await sock.groupMetadata(anu.id);
            let participants = anu.participants;
            for (let num of participants) {
                // Add welcome/goodbye message logic here if needed
            }
        } catch (err) {
            console.log(err);
        }
    });

    // Anti-call feature
    sock.ev.on('call', async (celled) => {
        if (config.anticall) {
            console.log(celled);
            for (let kopel of celled) {
                if (kopel.isGroup == false) {
                    if (kopel.status == "offer") {
                        let nomer = await sock.sendTextWithMentions(kopel.from, `*${sock.user.name}* can't receive calls. Sorry @${kopel.from.split('@')[0]} you will be blocked!`);
                        sock.sendContact(kopel.from, config.owner, nomer);
                        await sleep(8000);
                        await sock.updateBlockStatus(kopel.from, "block");
                    }
                }
            }
        }
    });

    return sock;
}

startRika();

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});
