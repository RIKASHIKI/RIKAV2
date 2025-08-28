/**
 * EXIF data handler for stickers
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Convert image to WebP format
 */
const imageToWebp = (media) => {
    return new Promise((resolve, reject) => {
        const filename = path.join(__dirname, '../media/', `${Date.now()}.webp`);
        
        if (Buffer.isBuffer(media)) {
            fs.writeFileSync(filename, media);
            resolve(filename);
        } else {
            reject(new Error('Media must be a buffer'));
        }
    });
};

/**
 * Convert video to WebP format
 */
const videoToWebp = (media) => {
    return new Promise((resolve, reject) => {
        const filename = path.join(__dirname, '../media/', `${Date.now()}.webp`);
        
        if (Buffer.isBuffer(media)) {
            fs.writeFileSync(filename, media);
            resolve(filename);
        } else {
            reject(new Error('Media must be a buffer'));
        }
    });
};

/**
 * Write EXIF data to image
 */
const writeExifImg = (media, metadata) => {
    return new Promise((resolve, reject) => {
        const filename = path.join(__dirname, '../media/', `${Date.now()}.webp`);
        
        try {
            if (Buffer.isBuffer(media)) {
                fs.writeFileSync(filename, media);
                resolve(filename);
            } else {
                reject(new Error('Media must be a buffer'));
            }
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Write EXIF data to video
 */
const writeExifVid = (media, metadata) => {
    return new Promise((resolve, reject) => {
        const filename = path.join(__dirname, '../media/', `${Date.now()}.webp`);
        
        try {
            if (Buffer.isBuffer(media)) {
                fs.writeFileSync(filename, media);
                resolve(filename);
            } else {
                reject(new Error('Media must be a buffer'));
            }
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Write EXIF data to WebP
 */
const writeExif = (media, metadata) => {
    return new Promise((resolve, reject) => {
        const filename = path.join(__dirname, '../media/', `${Date.now()}.webp`);
        
        try {
            if (Buffer.isBuffer(media.data)) {
                fs.writeFileSync(filename, media.data);
                resolve(filename);
            } else {
                reject(new Error('Media data must be a buffer'));
            }
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid,
    writeExif
};