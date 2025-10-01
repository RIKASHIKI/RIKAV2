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
function sortObject(obj) {
    if (Array.isArray(obj)) return obj.map(sortObject);
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).sort().reduce((acc, k) => {
            acc[k] = sortObject(obj[k]);
            return acc;
        }, {});
    }
    return obj;
}

function normalizeId(id) {
    try {
        return JSON.stringify(sortObject(id));
    } catch (e) {
        return String(id);
    }
}

function dedupeArray(arr) {
    const seen = new Set();
    return arr.filter(item => {
        const key = normalizeId(item.id || item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function canonicalUserKey(val) {
    if (!val) return '';
    if (typeof val === 'string') return val.split('@')[0];
    if (typeof val === 'object') {
        if (val.user) return String(val.user);
        // if it's { id: '123@...' }
        if (val.id && typeof val.id === 'string') return val.id.split('@')[0];
    }
    return normalizeId(val);
}

function canonicalGroupKey(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        if (val.id && typeof val.id === 'string') return val.id;
    }
    return normalizeId(val);
}

function dedupeUsers(arr) {
    const seen = new Set();
    return arr.filter(item => {
        const key = canonicalUserKey(item.id || item);
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function dedupeGroups(arr) {
    const seen = new Set();
    return arr.filter(item => {
        const key = canonicalGroupKey(item.id || item);
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

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
function dedupeFile(filePath, keyName) {
    try {
        if (fs.existsSync(filePath)) {
            let d = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (d && Array.isArray(d[keyName])) {
                if (keyName === 'users') d[keyName] = dedupeUsers(d[keyName]);
                else d[keyName] = dedupeGroups(d[keyName]);
                fs.writeFileSync(filePath, JSON.stringify(d, null, 2));
            }
        }
    } catch (e) {
        console.error('Dedupe error:', filePath, e);
    }
}
dedupeFile(usersPath, 'users');
dedupeFile(groupsPath, 'groups');

// Read users
function getUsers() {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        if (!Array.isArray(data.users)) data.users = [];
        data.users = dedupeUsers(data.users);
    } catch (e) {
        data = { users: [] };
        fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
    }
    return data.users;
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
        data.users = dedupeUsers(data.users);
        if (!data.users.find(u => canonicalUserKey(u.id || u) === canonicalUserKey(number))) {
            data.users.push({ id: number });
            data.users = dedupeUsers(data.users);
            fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
            console.log('User added:', number);
        }
}

// Read groups
function getGroups() {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));
        if (!Array.isArray(data.groups)) data.groups = [];
        data.groups = dedupeGroups(data.groups);
    } catch (e) {
        data = { groups: [] };
        fs.writeFileSync(groupsPath, JSON.stringify(data, null, 2));
    }
    return data.groups;
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
        data.groups = dedupeGroups(data.groups);
        if (!data.groups.find(g => canonicalGroupKey(g.id || g) === canonicalGroupKey(groupId))) {
            data.groups.push({ id: groupId, mute: false });
            data.groups = dedupeGroups(data.groups);
            fs.writeFileSync(groupsPath, JSON.stringify(data, null, 2));
            console.log('Group added:', groupId);
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
