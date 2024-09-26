const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const bot = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'WhatMaildb'
    }),
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

bot.once('ready', () => {
    console.log('Client is ready!');
});

bot.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});


/**
 * Sends a verification code to the specified phone number via WhatsApp.
 *
 * @param {string} phoneNumber - The phone number to send the verification code to. 
 * It should include the country code, starting with '+'.
 * @param {string} code - The verification code to be sent.
 */
async function SendVerificationCode(phoneNumber, code) {
    // Remove the '+' from the phone number
    const sanitizedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
    const whatsnumber = sanitizedPhoneNumber + '@c.us';
    bot.sendMessage(whatsnumber, `*Welcome to WhatMail!* Your verification code is *${code}*. Please enter this code to complete the verification of your account. 
        
        For security reasons, please *do not share* this code with anyone. If you did not request this code or believe this message was sent to you in error, please contact our support team immediately.
        
        Thank you for choosing WhatMail.
        
        *Best regards*,
        The WhatMail Team`);

}

/**
 * Sends a message to a user via WhatsApp.
 *
 * @param {string} phoneNumber - The phone number of the recipient, including the country code (e.g., +1234567890).
 * @param {string} message - The message to be sent to the user.
 */
async function SendToUser(phoneNumber, message) {
    // Remove the '+' from the phone number
    const sanitizedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
    const whatsnumber = sanitizedPhoneNumber + '@c.us';
    bot.sendMessage(whatsnumber, `${message}`);
}

bot.initialize();

module.exports = {
    bot,
    SendToUser,
    SendVerificationCode
};
