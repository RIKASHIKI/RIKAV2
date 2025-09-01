/**
 * Message handler for RIKA Bot
 */

const { color } = require('../lib/color');
const moment = require('moment-timezone');
const { fetchJson } = require('../lib/myfunc');

module.exports = async (sock, m, chatUpdate, store) => {
    try {
        const body = (m.mtype === 'conversation') ? m.message.conversation : 
                     (m.mtype === 'imageMessage') ? m.message.imageMessage.caption : 
                     (m.mtype === 'videoMessage') ? m.message.videoMessage.caption : 
                     (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : 
                     (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : 
                     (m.mtype === 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : 
                     (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : '';
        
        const budy = (typeof m.text == 'string' ? m.text : '');
        const prefix = prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : prefa ?? global.prefix;
        const isCmd = body.startsWith(prefix);
        const command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const isGroup = m.chat.endsWith('@g.us');
        const sender = m.sender;
        const text = q = args.join(" ");
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const isMedia = /image|video|sticker|audio/.test(mime);
        
        // Group info
        const groupMetadata = isGroup ? await sock.groupMetadata(m.chat).catch(e => {}) : '';
        const groupName = isGroup ? groupMetadata.subject : '';
        const participants = isGroup ? await groupMetadata.participants : '';
        const groupAdmins = isGroup ? await participants.filter(v => v.admin !== null).map(v => v.id) : '';
        const groupOwner = isGroup ? groupMetadata.owner : '';
        const isBotAdmins = isGroup ? groupAdmins.includes(sock.user.id) : false;
        const isAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
        
        // Bot info
        const isCreator = [sock.user.id, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
        const isPremium = isCreator || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender) || false;
        
        // Public and private mode
        if (!sock.public) {
            if (!m.key.fromMe) return;
        }
        
        // Console logging
        if (m.message) {
            console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32mCMD\x1b[1;37m]', time, color(budy || m.mtype, 'yellow'), 'from', color(pushname), 'in', color(isGroup ? groupName : 'Private Chat', 'blue'));
        }
        
        // Auto read
        if (global.autoread) {
            sock.readMessages([m.key]);
        }
        
        // Auto typing
        if (global.autotyping && isCmd) {
            sock.sendPresenceUpdate('composing', m.chat);
        }
        
        // Auto recording
        if (global.autorecording && isCmd) {
            sock.sendPresenceUpdate('recording', m.chat);
        }
        
        // Commands
        switch (command) {
            case 'help':
            case 'menu':
                const menuText = `
*╭─「 RIKA BOT MENU 」*
*│* 
*│* ◦ Owner: ${global.ownername}
*│* ◦ Prefix: ${prefix}
*│* ◦ Mode: ${sock.public ? 'Public' : 'Self'}
*│* ◦ Runtime: ${runtime(process.uptime())}
*│* 
*├─「 MAIN COMMANDS 」*
*│* 
*│* ◦ ${prefix}help
*│* ◦ ${prefix}ping
*│* ◦ ${prefix}runtime
*│* ◦ ${prefix}owner
*│* 
*╰────────────⬣*

_Bot by RIKASHIKI_
                `;
                m.reply(menuText);
                break;
                
            case 'ping':
                const timestamp = speed();
                const latensi = speed() - timestamp;
                m.reply(`*Pong!*\n\n🏓 Speed: ${latensi.toFixed(4)} _Second_`);
                break;
                
            case 'runtime':
                m.reply(`*Runtime:* ${runtime(process.uptime())}`);
                break;
                
            case 'owner':
                // Baileys v6+ compatible contact message
                const contacts = Array.isArray(global.owner) ? global.owner : [global.owner];
                const vcard = contacts.map(num => `BEGIN:VCARD\nVERSION:3.0\nFN:${global.ownername || 'Owner'}\nTEL;type=CELL;type=VOICE;waid=${num}:${num}\nEND:VCARD`).join('\n');
                await sock.sendMessage(m.chat, {
                    contacts: {
                        displayName: global.ownername || 'Owner',
                        contacts: contacts.map(num => ({ vcard }))
                    }
                }, { quoted: m });
                break;
                
            case 'public':
                if (!isCreator) return m.reply('Only for owner!');
                sock.public = true;
                m.reply('Successfully changed to public mode');
                break;
                
            case 'self':
                if (!isCreator) return m.reply('Only for owner!');
                sock.public = false;
                m.reply('Successfully changed to self mode');
                break;
                
            default:
                if (isCmd && budy.toLowerCase() != undefined) {
                    if (m.chat.endsWith('broadcast')) return;
                    if (m.isBaileys) return;
                    let msgs = global.db.database
                    if (!(command in msgs)) return m.reply(`Command *${prefix + command}* not found!`);
                    msgs[command]
                }
        }
        
    } catch (err) {
        console.log(err);
    }
};

// Helper functions
const speed = () => {
    return new Date();
};

const runtime = function(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss');
