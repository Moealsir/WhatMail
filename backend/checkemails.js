const { google } = require('googleapis');
const base64 = require('base64url');
const fs = require('fs');
const path = require('path');
const { LoadToken, UserAuthorized, getOauth2Client, GetClientData, ReadCredentials, mysql, dbConfig } = require('./auth');
const { bot, SendToUser, SendVerificationCode } = require('./whatsapp');
const BASE_URL = 'http://localhost:5000';
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();
let genAI;
let model;

try {
  genAI = new GoogleGenerativeAI(process.env.API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
} catch (error) {
  logError(error);
  process.exit(1); // Exit if the initialization fails
}


// Function to summarize email content using Gemini API
async function retryWithDelay(fn, prompts, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn(prompts[i]);
      } catch (error) {
        logError(error);
        if (error.message.includes('SAFETY')) {
          console.warn(`Prompt rejected due to safety concerns: ${prompts[i]}`);
        }
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

async function getGmailClient(user_id, email) {
    const tokenData = await LoadToken(user_id, email);
    if (!tokenData) {
        throw new Error('Token not found. Please authorize the user first.');
    }
    const { client_id, client_secret } = await GetClientData(user_id, email);
    const oauth2Client = getOauth2Client(client_id, client_secret, `${BASE_URL}/oauth2callback`);
    oauth2Client.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
}


async function checkForNewEmails(user_id, email, lastChecked) {
    const gmail = await getGmailClient(user_id, email);
    const query = `after:${Math.floor(lastChecked.getTime() / 1000)}`;
    const response = await gmail.users.messages.list({
        userId: 'me',
        q: query
    });

    const messages = response.data.messages || [];
    return messages;
}

async function getPhoneNumber(user_id, email) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT phone_number FROM users WHERE user_id = ?', [user_id]);
    connection.end();
    return rows[0].phone_number;
}

async function downloadAttachment(user_id, email, messageId, attachmentId, filename) {
    const gmail = await getGmailClient(user_id, email);
    const res = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
    });

    const data = base64.decode(res.data.data);
    const filePath = path.join(__dirname, 'attachments', filename);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data);
    console.log(`Downloaded attachment: ${filename}`);
}

async function formatAndSendEmailDetails(phoneNumber, receiverEmail, emailDetails) {
    const { senderEmail, subject, body, emailId } = emailDetails;

    // Construct the URL to the full email in Gmail
    const emailUrl = `https://mail.google.com/mail/u/0/#inbox/${emailId}`;

    // Split the email body into words
    const words = body.split(/\s+/);
    
    // Check if the email body is too long
    if (words.length > 50) {
        // Get the first 50 words and join them into a string
        const previewBody = words.slice(0, 50).join(' ');
        
        // Construct the message body with a link to the full email
        let messageBody = `*From:* ${senderEmail}\n*To:* ${receiverEmail}\n*Subject:* ${subject}\n\n${previewBody}...\n\n[Read more](${emailUrl})`;
        console.log(messageBody)
        console.log(`awat to send to user`)
        await SendToUser(phoneNumber, messageBody);
    } else {
        let messageBody = `*From:* ${senderEmail}\n*To:* ${receiverEmail}\n*Subject:* ${subject}\n\n${body}\n`;

        await SendToUser(phoneNumber, messageBody);
    }
}

async function summarizeAndSendEmail(senderName, receiverEmail, senderEmail, subject, body, phoneNumber) {

    // Summarize the email content
    const summary = await summarizeEmailContent(senderName, senderEmail, subject, body);
    console.log(`summary: ${summary}`)
    // Rate the email content
    const rating = await rateEmailContent(senderName, senderEmail, subject, body);
    console.log(`summary: ${rating}`)

    console.log(`in function summarizeAndSendEmail phone number is : ${phoneNumber}`)
    // console.log("sending summary")
    const messageContent = `*From: ${senderName}* <${senderEmail}>\n*To:* ${receiverEmail}\n*Subject:* ${subject}\n\n${summary}\n\n${rating}`
    // await SendToUser(phoneNumber, summary);
    console.log("sending messageContent")
    await SendToUser(phoneNumber, messageContent);


}

async function summarizeEmailContent(senderName, senderEmail, subject, content) {
    const prompts = [
      `Act as my personal assistant and summarize the following email from ${senderName} (${senderEmail}) regarding "${subject}" in one to two paragraphs, highlighting important details:\n\n${content}`,
      `Provide a summary for the following email from ${senderName} (${senderEmail}) with the subject "${subject}", focusing on key points in one or two paragraphs:\n\n${content}`,
      `Summarize this email from ${senderName} (${senderEmail}), subject "${subject}", in one or two paragraphs, focusing on important details:\n\n${content}`
    ];
    return retryWithDelay(async (prompt) => {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = await response.text();
      return text.trim();
    }, prompts);
  }
  
async function rateEmailContent(senderName, senderEmail, subject, content) {
const prompts = [
    `Rate the following email from ${senderName} (${senderEmail}) with the subject "${subject}" as spam from 0 to 10, using these ratings: 0️⃣: ❌ | 1️⃣: 🚫 | 2️⃣: 🛑 | 3️⃣: ⚠️ | 4️⃣: 🔴 | 5️⃣: 🟠 | 6️⃣: 🟡 | 7️⃣: 🟢 | 8️⃣: 🔵 | 9️⃣: 🟣 | 🔟: 🌟. The email content is:\n\n${content}\n\n\n You don't have to explain the reason for the rating and remember to send a number and emoji.`,
    `Please rate the following email from ${senderName} (${senderEmail}), subject "${subject}", from 0 to 10 for its likelihood of being spam, using the provided rating scale: 0️⃣: ❌ | 1️⃣: 🚫 | 2️⃣: 🛑 | 3️⃣: ⚠️ | 4️⃣: 🔴 | 5️⃣: 🟠 | 6️⃣: 🟡 | 7️⃣: 🟢 | 8️⃣: 🔵 | 9️⃣: 🟣 | 🔟: 🌟. The email content is:\n\n${content}\n\n\n You don't have to explain the reason for the rating and remember to send a number and emoji.`,
    `Evaluate the following email from ${senderName} (${senderEmail}), subject "${subject}", and rate it as spam from 0 to 10, using this scale: 0️⃣: ❌ | 1️⃣: 🚫 | 2️⃣: 🛑 | 3️⃣: ⚠️ | 4️⃣: 🔴 | 5️⃣: 🟠 | 6️⃣: 🟡 | 7️⃣: 🟢 | 8️⃣: 🔵 | 9️⃣: 🟣 | 🔟: 🌟. Here is the content:\n\n${content}\n\n\n You don't have to explain the reason for the rating and remember to send a number and emoji.`
];
return retryWithDelay(async (prompt) => {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = await response.text();
    return text.trim();
}, prompts);
}
  

// main function that check new emails for users
    async function startCheckingEmails() {
        console.log('Checking for new emails...');
        const lastChecked = new Date(new Date().getTime() - 1 * 10000);

        try {
            const { users, emails } = await ReadCredentials();
            const authorizedEmails = emails.filter(email => email.authorized);

            for (const emailData of authorizedEmails) {
                const user_id = emailData.user_id;
                const email = emailData.email;
                const user_number = await getPhoneNumber(user_id, email);
                console.log(`the user_number in the for loop is: ${user_number}`)

                try {
                    const isAuthorized = await UserAuthorized(user_id, email);
                    if (!isAuthorized) {
                        console.log(`User ${user_id} with email ${email} is not authorized. Skipping...`);
                        continue;
                    }

                    const messages = await checkForNewEmails(user_id, email, lastChecked);
                    if (messages.length > 0) {
                        console.log(`New Emails for user ${user_id} with email ${email}:`, messages);

                        const gmail = await getGmailClient(user_id, email);
                        for (const message of messages) {
                            const msg = await gmail.users.messages.get({
                                userId: 'me',
                                id: message.id
                            });

                            const headers = msg.data.payload.headers;
                            let senderName = '';
                            let senderEmail = '';
                            let subject = '';
                            let body = '';
                            let attachments = [];

                            headers.forEach(header => {
                                if (header.name === 'From') {
                                    [senderName, senderEmail] = parseSender(header.value);
                                }
                                if (header.name === 'Subject') {
                                    subject = header.value;
                                }
                            });

                            if (msg.data.payload.parts) {
                                for (const part of msg.data.payload.parts) {
                                    if (part.mimeType === 'text/plain') {
                                        body = base64.decode(part.body.data);
                                    } else if (part.filename && part.filename.length > 0) {
                                        attachments.push({
                                            filename: part.filename,
                                            mimeType: part.mimeType,
                                            attachmentId: part.body.attachmentId
                                        });
                                    }
                                }
                            } else {
                                body = base64.decode(msg.data.payload.body.data);
                            }

                            const emailId = message.id; // Use message ID as email ID
                            const emailTime = new Date(parseInt(msg.data.internalDate, 10));
                            const emailDetails = { emailId, emailTime, senderName, senderEmail, subject, body, attachments };
                            console.log(`new email ${emailId} arrived at ${emailTime} from ${senderName} with email ${senderEmail}\n ${subject}`)

                            console.log(`#### entering function summarizeAndSendEmail ####`)
                            console.log(`user number is ${user_number}`)
                            await summarizeAndSendEmail(senderName, email, senderEmail, subject, body, user_number)
                            console.log(`#### exiting from function summarizeAndSendEmail ####`)

                            for (const attachment of attachments) {
                                await downloadAttachment(user_id, email, message.id, attachment.attachmentId, attachment.filename);
                            }

                            console.log('New Email:', emailDetails);

                            // await formatAndSendEmailDetails(user_number, email, emailDetails);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking emails for user ${user_id} with email ${email}:`, error);
                }
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    }


function parseSender(sender) {
    const parts = sender.split('<');
    const senderName = parts[0].trim();
    const senderEmail = parts[1].replace('>', '').trim();
    return [senderName, senderEmail];
}

setInterval(startCheckingEmails, 10000);

module.exports = {
    checkForNewEmails,
    startCheckingEmails,
};
