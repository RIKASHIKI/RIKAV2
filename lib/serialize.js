/**
 * Session serialization for WhatsApp connection
 */

const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const path = require('path');

const sessionPath = path.join(__dirname, '..', 'session');

let authState = null;

async function getAuthState() {
    if (!authState) {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        authState = {
            state: state,
            saveState: saveCreds
        };
    }
    return authState;
}

module.exports = {
    state: null,
    saveState: null,
    init: async () => {
        const auth = await getAuthState();
        module.exports.state = auth.state;
        module.exports.saveState = auth.saveState;
        return auth;
    }
};
