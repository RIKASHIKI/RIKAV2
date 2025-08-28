/**
 * Indonesian language pack
 */

exports.wait = () => {
    return `⏳ *Tunggu sedang di proses...*`;
}

exports.succes = () => {
    return `✅ *Berhasil...*`;
}

exports.lvlneed = (level) => {
    return `❌ *Level ${level} dibutuhkan untuk menggunakan command ini*`;
}

exports.admin = () => {
    return `❌ *Perintah ini hanya bisa digunakan oleh admin grup!*`;
}

exports.botAdmin = () => {
    return `❌ *Bot harus menjadi admin untuk menggunakan perintah ini!*`;
}

exports.owner = () => {
    return `❌ *Perintah ini hanya untuk Owner!*`;
}

exports.group = () => {
    return `❌ *Perintah ini hanya bisa digunakan di grup!*`;
}

exports.private = () => {
    return `❌ *Perintah ini hanya bisa digunakan di chat pribadi!*`;
}

exports.bot = () => {
    return `❌ *Nomor bot tidak bisa menggunakan perintah ini!*`;
}

exports.wait = () => {
    return `⏳ *Sedang diproses...*`;
}

exports.endLimit = () => {
    return `❌ *Limit harian anda telah habis, limit akan direset setiap jam 12*`;
}

exports.wrongFormat = (prefix) => {
    return `❌ *Format salah! Silahkan lihat cara penggunaan di ${prefix}menu*`;
}

exports.example = (usedPrefix, command, example) => {
    return `📝 *Contoh:* ${usedPrefix + command} ${example}`;
}
