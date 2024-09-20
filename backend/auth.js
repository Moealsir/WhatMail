
const { google } = require('googleapis');
const mysql = require('mysql2/promise');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
let cred_redirecturi = 'http://localhost:5000/oauth2callback';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1',
    database: 'gmail_to_whatsapp'
};

const connection = mysql.createConnection(dbConfig);

// 
async function ReadCredentials() {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT * FROM users');
    const [emails] = await connection.execute('SELECT * FROM emails');
    connection.end();
    return { users, emails };
} 

async function GetUserEmails(user_id) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT email FROM emails WHERE user_id = ?', [user_id]);
    connection.end();
    return rows.map(row => row.email);
}

async function GetClientData(user_id, email) {
    const connection = await mysql.createConnection(dbConfig);
    const [client_idRow] = await connection.execute('SELECT client_id FROM emails WHERE user_id = ? AND email = ?', [user_id, email]);
    const [client_secretRow] = await connection.execute('SELECT client_secret FROM emails WHERE user_id = ? AND email = ?', [user_id, email]);
    const client_id = client_idRow[0].client_id;
    const client_secret = client_secretRow[0].client_secret;
    connection.end();

    return { client_id, client_secret };
}

async function GetEmailCredentials(email) {
    const connection = await mysql.createConnection(dbConfig);
    const [emailRows] = await connection.execute('SELECT * FROM emails WHERE email = ?', [email]);
    connection.end();
    if (emailRows.length === 0) {
        throw new Error('Email ID not found in credentials.');
    }
    const emailData = emailRows[0];
    
    return {
        "web": {
            client_id: emailData.client_id,
            client_secret: emailData.client_secret,
            auth_uri: emailData.auth_uri,
            token_uri: emailData.token_uri,
            auth_provider_x509_cert_url: emailData.auth_provider_x509_cert_url,
            redirect_uris: [cred_redirecturi]
        }
    };
}

async function SaveToken(user_id, email, tokens) {
    const connection = await mysql.createConnection(dbConfig);
    
    const [existingTokens] = await connection.execute(
        'SELECT id FROM tokens WHERE user_id = ? AND email = ?',
        [user_id, email]
    );

    if (existingTokens.length > 0) {
        // Token exists, update it
        const tokenId = existingTokens[0].id;
        await connection.execute(
            'UPDATE tokens SET access_token = ?, refresh_token = ? WHERE id = ?',
            [tokens.access_token, tokens.refresh_token || null, tokenId]
        );
    } else {
        // Token does not exist, insert a new one
        await connection.execute(
            'INSERT INTO tokens (user_id, email, access_token, refresh_token) VALUES (?, ?, ?, ?)',
            [user_id, email, tokens.access_token, tokens.refresh_token || null]
        );
    }
    
    connection.end();
}


async function LoadToken(user_id, email) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tokens WHERE user_id = ? AND email = ?', [user_id, email]);
    connection.end();
    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

async function UpdateAuthorizationStatus(user_id, email, status) {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE emails SET authorized = ? WHERE user_id = ? AND email = ?', [status, user_id, email]);
    connection.end();
}

async function UserAuthorized(user_id, email) {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute('SELECT authorized FROM emails WHERE user_id = ? AND email = ?', [user_id, email]);
    connection.end();
    if (rows.length === 0) {
        throw new Error('Email ID not found for the user.');
    }
    return rows[0].authorized;
}

function getOauth2Client(clientId, clientSecret, redirectUri) {
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

module.exports = {
    SCOPES,
    ReadCredentials,
    GetUserEmails,
    GetEmailCredentials,
    SaveToken,
    LoadToken,
    UpdateAuthorizationStatus,
    UserAuthorized,
    getOauth2Client,
    GetClientData,
    mysql, dbConfig, connection};
 