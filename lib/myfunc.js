/**
 * Helper functions for RIKA Bot
 */
const fs = require('fs');
const crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const webp = require('node-webpmux');
const path = require('path');
const axios = require('axios');
const { proto, jidDecode } = require('@whiskeysockets/baileys');

// Paths
const usersPath = path.join(__dirname, '../database/users.json');
const groupsPath = path.join(__dirname, '../database/groups.json');

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&=]*)/, 'gi'));
};

const getBuffer = async (url, options) => {
    try {
        options ? options : {};
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

const fetchJson = async (url, options) => {
    try {
        options ? options : {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
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

const clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
};

const generateMessageTag = (epoch) => {
    let tag = (epoch || unixTimestampSeconds()).toString();
    return tag;
};

// Normalisasi objek menjadi string stabil (urutkan keys) untuk perbandingan
const sortObject = (obj) => {
    if (Array.isArray(obj)) return obj.map(sortObject);
    if (obj && typeof obj === 'object') {
        const keys = Object.keys(obj).sort();
        const res = {};
        for (const k of keys) res[k] = sortObject(obj[k]);
        return res;
    }
    return obj;
};

const normalizeId = (id) => {
    try {
        return JSON.stringify(sortObject(id));
    } catch (e) {
        return String(id);
    }
};

const smsg = (conn, m, store) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = jidDecode(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '');
        if (m.isGroup) m.participant = jidDecode(m.key.participant) || '';
    }
    
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]);
        m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text;
        
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        
        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = m.quoted[type];
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            if (typeof m.quoted === 'string') m.quoted = {
                text: m.quoted
            };
            m.quoted.mtype = type;
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = jidDecode(m.msg.contextInfo.participant || m.quoted.chat || '');
            m.quoted.fromMe = m.quoted.sender === jidDecode(conn.user.id);
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || '';
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, conn);
                return exports.smsg(conn, q, store);
            };
            
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });
            
            m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options);
            m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
        }
    }
    
    if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg);
    m.text = m.msg.text || m.msg.caption || m.message.conversation || (m.msg.contentText && m.msg.contentText) || (m.msg.selectedDisplayText && m.msg.selectedDisplayText) || '';
    
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text)
        ? conn.sendMedia(chatId, text, 'file', '', m, { ...options })
        : conn.sendMessage(chatId, { text }, { quoted: m, ...options });
    m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
    
    return m;
};

const getContentType = (message) => {
    if (message) {
        const keys = Object.keys(message);
        const key = keys.find(k => (k === 'conversation' || k.endsWith('Message')) && k !== 'senderKeyDistributionMessage');
        return key;
    }
};

// --- Group mute management ---

function isGroupMuted(groupId) {
  const data = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));
  const group = data.groups.find(g => g.id === groupId);
  return group ? group.mute : false;
}

function setGroupMute(groupId, mute) {
  const data = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));
  let group = data.groups.find(g => g.id === groupId);
  if (group) {
    group.mute = mute;
  } else {
    data.groups.push({ id: groupId, mute });
  }
  fs.writeFileSync(groupsPath, JSON.stringify(data, null, 2));
}

module.exports.isGroupMuted = isGroupMuted;
module.exports.setGroupMute = setGroupMute;

// Deduplikasi awal: bersihkan entri duplikat jika file ada
try {
    if (fs.existsSync(usersPath)) {
        let d = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        if (d && Array.isArray(d.users)) {
            const seen = new Set();
            d.users = d.users.filter(u => {
                const key = normalizeId(u.id || u);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            fs.writeFileSync(usersPath, JSON.stringify(d, null, 2));
        }
    }
    if (fs.existsSync(groupsPath)) {
        let d = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));
        if (d && Array.isArray(d.groups)) {
            const seen = new Set();
            d.groups = d.groups.filter(g => {
                const key = normalizeId(g.id || g);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            fs.writeFileSync(groupsPath, JSON.stringify(d, null, 2));
        }
    }
} catch (e) {
    // ignore initialization dedupe errors
}

// Read users
function getUsers() {
  const data = fs.readFileSync(usersPath, 'utf-8');
  return JSON.parse(data).users;
}

// Add user
function addUser(number) {
    let data;
    if (!fs.existsSync(usersPath)) {
        data = { users: [] };
        fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
    }
    try {
        data = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        if (!data.users) data.users = [];
    } catch (e) {
        data = { users: [] };
        fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
    }
    // Cek duplikat berdasarkan isi id
    // Deep compare untuk objek id
        const key = normalizeId(number);
        if (!data.users.find(u => normalizeId(u.id || u) === key)) {
        data.users.push({ id: number });
        fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
    }
}

// Read groups
function getGroups() {
  const data = fs.readFileSync(groupsPath, 'utf-8');
  return JSON.parse(data).groups;
}

// Add group
function addGroup(groupId) {
    let data;
    if (!fs.existsSync(groupsPath)) {
        data = { groups: [] };
        fs.writeFileSync(groupsPath, JSON.stringify(data, null, 2));
    }
    try {
        data = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));
        if (!data.groups) data.groups = [];
    } catch (e) {
        data = { groups: [] };
        fs.writeFileSync(groupsPath, JSON.stringify(data, null, 2));
    }
    // Cek duplikat berdasarkan isi id
    // Deep compare untuk objek id
        const key = normalizeId(groupId);
        if (!data.groups.find(g => normalizeId(g.id || g) === key)) {
        data.groups.push({ id: groupId, mute: false });
        fs.writeFileSync(groupsPath, JSON.stringify(data, null, 2));
    }
}

module.exports = {
    unixTimestampSeconds,
    generateMessageTag,
    getBuffer,
    fetchJson,
    runtime,
    clockString,
    sleep,
    isUrl,
    smsg,
    getContentType,
    getUsers,
    addUser,
    getGroups,
    addGroup
};
