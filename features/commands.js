module.exports = async (sock, m, command, { isCreator, runtime, speed }) => {
  switch (command) {
    case 'ping': {
      const timestamp = speed();
      const latensi = speed() - timestamp;
      m.reply(`*Pong!*\n\n🏓 Speed: ${latensi.toFixed(4)} _Second_`);
      break;
    }
    case 'runtime': {
      m.reply(`*Runtime:* ${runtime(process.uptime())}`);
      break;
    }
    case 'owner': {
      const contacts = Array.isArray(global.owner) ? global.owner : [global.owner];
      const vcard = contacts.map(num => `BEGIN:VCARD\nVERSION:3.0\nFN:${global.ownername || 'Owner'}\nTEL;type=CELL;type=VOICE;waid=${num}:${num}\nEND:VCARD`).join('\n');
      await sock.sendMessage(m.chat, {
        contacts: {
          displayName: global.ownername || 'Owner',
          contacts: contacts.map(num => ({ vcard }))
        }
      }, { quoted: m });
      break;
    }
    case 'public': {
      if (!isCreator) return m.reply('Only for owner!');
      sock.public = true;
      m.reply('Successfully changed to public mode');
      break;
    }
    case 'self': {
      if (!isCreator) return m.reply('Only for owner!');
      sock.public = false;
      m.reply('Successfully changed to self mode');
      break;
    }
  }
};
