const { isGroupMuted, setGroupMute } = require('../lib/myfunc');

module.exports = async (sock, m, command) => {
  if (!m.isGroup) return m.reply('This command only works in groups.');
  if (command === 'mute') {
    setGroupMute(m.chat, true);
    return m.reply('Bot muted in this group.');
  }
  if (command === 'unmute') {
    setGroupMute(m.chat, false);
    return m.reply('Bot unmuted in this group.');
  }
};
