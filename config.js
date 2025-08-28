/**
 * RIKA WhatsApp Bot Configuration
 */

const fs = require('fs');
// Use a simple color function instead of chalk to avoid ESM issues
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    redBright: (text) => `\x1b[91m${text}\x1b[0m`,
    keyword: (color) => (text) => text
};

// Owner configuration
global.owner = process.env.OWNER_NUMBERS ? process.env.OWNER_NUMBERS.split(',') : ['6287820032793', '6288744328279'];
global.mods = process.env.MODS ? process.env.MODS.split(',') : [];
global.prems = process.env.PREMS ? process.env.PREMS.split(',') : [];

// Bot configuration
global.packname = process.env.PACK_NAME || 'RKS MD';
global.author = process.env.AUTHOR || '088744328279';
global.ownername = process.env.OWNER_NAME || 'RIKASHIKI';
global.ownernumber = process.env.OWNER_NUMBER || '6287820032793';
global.sessionName = process.env.SESSION_NAME || 'session';

// Bot settings
global.modepub = process.env.PUBLIC_MODE === 'true' || true;
global.lang = process.env.LANGUAGE || 'ind';
global.anticall = process.env.ANTI_CALL === 'true' || false;
global.autoread = process.env.AUTO_READ === 'true' || false;
global.autotyping = process.env.AUTO_TYPING === 'true' || false;
global.autorecording = process.env.AUTO_RECORDING === 'true' || false;
global.autobio = process.env.AUTO_BIO === 'true' || false;

// Media and links
global.thumbnaili = './media/RKS.jpg';
global.video = './media/VIDEOWIBU.mp4';
global.youtube = process.env.YOUTUBE || 'https://youtube.com/c/RIKASHIKI';
global.webyou = process.env.WEBSITE || 'https://github.com/RIKASHIKI/RIKA';
global.email = process.env.EMAIL || 'hariamd210@gmail.com';
global.loc = process.env.LOCATION || 'JAPAN';
global.instagram = process.env.INSTAGRAM || 'https://instagram.com/@rikashiki_san';
global.grup = process.env.GROUP_LINK || 'https://chat.whatsapp.com/E4YXacQLqPh3isulcGqlSA';

// Prefix configuration
global.prefa = ['', '!', '.', '🐦', '🐤', '🗿'];
global.prefix = process.env.PREFIX || '.';
global.sp = process.env.SEPARATOR || 'Ξ';

// Footer and credits
global.fouter = process.env.FOOTER || 'RIKASHIKI | RKS-MD ©2022';

// API Keys (get from environment variables)
global.zenzkey = process.env.ZENZ_API_KEY || 'your_zenz_api_key';
global.lolkey = process.env.LOL_API_KEY || 'your_lol_api_key';

// Database
global.mongourl = process.env.MONGO_URL || '';

// Timezone
global.timezone = process.env.TZ || 'Asia/Jakarta';

// Console colors
global.log = (text, color) => {
    return !color ? colors.green(text) : colors.keyword(color)(text);
};

// File watch for hot reload
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(colors.redBright("Update 'config.js'"));
    delete require.cache[file];
    require(file);
});
