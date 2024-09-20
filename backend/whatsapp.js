const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { mysql, dbConfig } = require('./auth');

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


async function checkUnique(field, value) {
    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM users WHERE ${field} = ?`;
    const [rows] = await connection.execute(query, [value]);
    connection.end();
    return rows.length === 0;
}

async function saveUserDetails(username, phoneNumber, email, clientId, clientSecret, password) {
    const connection = await mysql.createConnection(dbConfig);

    // Insert user into users table
    const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, phone_number, password) VALUES (?, ?, ?, ?)',
        [username, email, phoneNumber, password]
    );

    const userId = userResult.insertId;

    // Insert email details into emails table
    await connection.execute(
        'INSERT INTO emails (user_id, email, client_id, client_secret) VALUES (?, ?, ?, ?)',
        [userId, email, clientId, clientSecret]
    );

    connection.end();
    return userId;
}

bot.on('message', async (message) => {
    // console.log('Received message:', message.body);

    if (message.body.toLowerCase() === 'start') {
        await bot.sendMessage(message.from, 'Please send your username:');
        await askForDetails(message.from);
    }
});

// not important
async function askForDetails(chatId) {
    let username, phoneNumber, email, clientId, clientSecret, password;

    // Ask for username
    while (true) {
        const response = await waitForMessage(chatId);
        username = response.body.trim();
        if (await checkUnique('username', username)) {
            break; // Valid username
        }
        await bot.sendMessage(chatId, 'Username is already in use. Please provide a new username:');
    }

    // Ask for phone number
    while (true) {
        await bot.sendMessage(chatId, 'Please send your phone number in the format `249123123123`:');
        const response = await waitForMessage(chatId);
        phoneNumber = response.body.trim();
        if (/^\d{12}$/.test(phoneNumber) && await checkUnique('phone_number', phoneNumber)) {
            break; // Valid phone number
        }
        await bot.sendMessage(chatId, 'Phone number is already in use or invalid. Please provide a new phone number:');
    }

    // Ask for email
    while (true) {
        await bot.sendMessage(chatId, 'Please send your email (must contain "@" and "."):');
        const response = await waitForMessage(chatId);
        email = response.body.trim();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && await checkUnique('email', email)) {
            break; // Valid email
        }
        await bot.sendMessage(chatId, 'Email is already in use or invalid. Please provide a new email:');
    }

    // Ask for client ID
    await bot.sendMessage(chatId, 'Please send your client ID:');
    const clientIdResponse = await waitForMessage(chatId);
    clientId = clientIdResponse.body.trim();

    // Ask for client secret
    await bot.sendMessage(chatId, 'Please send your client secret:');
    const clientSecretResponse = await waitForMessage(chatId);
    clientSecret = clientSecretResponse.body.trim();

    // Ask for password
    await bot.sendMessage(chatId, 'Please set your password:');
    const passwordResponse = await waitForMessage(chatId);
    password = passwordResponse.body.trim();

    // Save details to the database
    try {
        const userId = await saveUserDetails(username, phoneNumber, email, clientId, clientSecret, password);
        const authorizationUrl = `http://https://wm.moealsir.tech/authorize?user_id=${userId}&email=${encodeURIComponent(email)}`;
        await bot.sendMessage(chatId, `Thank you! Your details have been saved. You can authorize your email at: ${authorizationUrl}`);
    } catch (error) {
        console.error('Error saving to database:', error);
        await bot.sendMessage(chatId, 'There was an error saving your details. Please try again.');
    }
}

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

async function SendToUser(phoneNumber, message) {
    // Remove the '+' from the phone number
    const sanitizedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
    const whatsnumber = sanitizedPhoneNumber + '@c.us';
    bot.sendMessage(whatsnumber, `${message}`);
}

// Helper function to wait for a message
function waitForMessage(chatId) {
    return new Promise((resolve) => {
        const listener = async (msg) => {
            if (msg.from === chatId) {
                bot.off('message', listener);
                
                resolve(msg);
            }
        };
        bot.on('message', listener);
    });
}
bot.initialize();

module.exports = {
    bot,
    SendToUser,
    SendVerificationCode
};
