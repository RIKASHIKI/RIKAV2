/**
 * English language pack
 */

exports.wait = () => {
    return `⏳ *Wait, processing...*`;
}

exports.succes = () => {
    return `✅ *Success...*`;
}

exports.lvlneed = (level) => {
    return `❌ *Level ${level} is required to use this command*`;
}

exports.admin = () => {
    return `❌ *This command can only be used by group admins!*`;
}

exports.botAdmin = () => {
    return `❌ *Bot must be admin to use this command!*`;
}

exports.owner = () => {
    return `❌ *This command is only for Owner!*`;
}

exports.group = () => {
    return `❌ *This command can only be used in groups!*`;
}

exports.private = () => {
    return `❌ *This command can only be used in private chat!*`;
}

exports.bot = () => {
    return `❌ *Bot numbers cannot use this command!*`;
}

exports.wait = () => {
    return `⏳ *Processing...*`;
}

exports.endLimit = () => {
    return `❌ *Your daily limit has run out, the limit will be reset every 12 o'clock*`;
}

exports.wrongFormat = (prefix) => {
    return `❌ *Wrong format! Please see usage in ${prefix}menu*`;
}

exports.example = (usedPrefix, command, example) => {
    return `📝 *Example:* ${usedPrefix + command} ${example}`;
}
