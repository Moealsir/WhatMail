const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const {
    SCOPES, 
    mysql,
    ReadCredentials,
    GetUserEmails,
    GetEmailCredentials,
    SaveToken,
    LoadToken,
    UpdateAuthorizationStatus,
    UserAuthorized,
    getOauth2Client
} = require('./auth'); 

const { SendVerificationCode } = require('./whatsapp');
const { startCheckingEmails } = require('./checkemails');

let verificationCodes = {}; // Store codes temporarily

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(session({
    secret: 'secret', // a secret key used to sign the session ID cookie
    resave: false, // forces the session to be saved back to the session store
    saveUninitialized: true, // forces a session that is "uninitialized" to be saved to the store
    cookie: { // settings for the session ID cookie
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 5000;
const BASE_URL = 'http://localhost:5000';

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Load SSL certificates from Certbot
// const sslOptions = {
//     key: fs.readFileSync('/etc/letsencrypt/live/wm.moealsir.tech/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/wm.moealsir.tech/fullchain.pem')
// };

(async () => {

    // connect to database
    // use .env instead
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1',
        database: 'gmail_to_whatsapp'
    });

    // home
    app.get('/test', async (req, res) => {
        if (req.session.username) {
            res.send(`Welcome, ${req.session.username}!`);
        } else {
            res.send(`please sign up first `)
        }
    });


    app.get('/api/check-session', (req, res) => {
        if (req.session && req.session.username) {
            return res.status(200).json({ isLoggedIn: true, username: req.session.username });
          }
          return res.status(200).json({ isLoggedIn: false });
    });

    app.post('/api/login', async (req, res) => {
        const { identifier, password } = req.body;
    
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Username or email and password are required.' });
        }
    
        try {
            let user;
    
            if (identifier.includes('@') && identifier.includes('.')) {
                // Login with email
                const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [identifier]);
                if (rows.length === 0) {
                    return res.status(400).json({ error: 'Email not found.' });
                }
                user = rows[0];
            } else {
                // Login with username
                const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [identifier]);
                if (rows.length === 0) {
                    return res.status(400).json({ error: 'Username not found.' });
                }
                user = rows[0];
            }
    
            // Check password
            if (user.password !== password) {
                return res.status(400).json({ error: 'Incorrect password.' });
            }
    
            console.log('Login successful.');
            req.session.username = user.username;
            console.log(req.session.username);
            console.log('Session saved:', req.session);

            // Uncomment one of the following based on your desired behavior:
    
            // Option 1: Redirect after successful login
            // res.redirect('/success');
    
            // Option 2: Return JSON response
            // console.log(res)
            return res.status(200).json({ message: 'Login successful.', login: true, username: user.username, userId: user.id });
    
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'login - Database error.', login: false });
        }
    });
    
    app.get('/success', (req, res) => {
        res.send('Authorization successful! You can close this window or go back to the app.');
    });
    
    // signup api
    app.post('/api/signup', async (req, res) => {
        // get variables from request
        const { username, email, phoneNumber, password, clientId, clientSecret } = req.body;

        // check phone number verfication
        if (!verificationCodes[phoneNumber]) {
            return res.status(400).json({ error: "Phone not verified." });
        }
        
        // check if field was empty
        if (!username || !email || !phoneNumber || !password) {
            return res.status(400).json({ 'error': 'All fields are required.' });
        }
    
        try {
            // check if user already exists
            const [userRows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (userRows.length > 0) {
                return res.status(400).json({ 'error': 'Username already exists.' });
            }
            
            // check email existance 
            const [emailRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            if (emailRows.length > 0) {
                return res.status(400).json({ 'error': 'Email already exists.' });
            }
            
            // check number existance 
            const [whatsappRows] = await db.execute('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
            if (whatsappRows.length > 0) {
                return res.status(400).json({ 'error': 'WhatsApp number already exists.' });
            }
            
            // add user to database
            const [result] = await db.execute('INSERT INTO users (username, email, phone_number, password) VALUES (?, ?, ?, ?)',
                [username, email, phoneNumber, password]);
            console.log('User added to database successfully.');
    
            const userId = result.insertId;
            
            // inster credentials into emails table
            await db.query(
                "INSERT INTO emails (user_id, email, client_id, client_secret) VALUES (?, ?, ?, ?)",
                [userId, email, clientId, clientSecret]
            );
            // console.log('Credentials saved to database successfully.');
            // await bot.sendMessage(phoneNumber, `Welcome to the Gmail to WhatsApp app, ${username}!`);
            console.log('Welcome message sent to WhatsApp.');
            res.status(201).json({ 'message': 'User created successfully.', userId });

        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ 'error': 'SignUp - Database error.' });
        }
    });

    // api to send code using whatsapp
    app.post('/api/send-code', async (req, res) => {
        const { phoneNumber } = req.body;
    
        // Log the received phoneNumber
        console.log(`Received phoneNumber: ${phoneNumber}`);
    
        // Validate phoneNumber
        if (!phoneNumber) {
            return res.status(400).json({ error: "Phone number is required." });
        }
    
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
    
            if (rows.length > 0) {
                console.log('Phone number already exists.');
                return res.status(400).json({ error: "Phone number already exists." });
            }
            delete verificationCodes[phoneNumber];
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            verificationCodes[phoneNumber] = code;
            SendVerificationCode(phoneNumber, code);
            res.status(200).json({ message: "Verification code sent." });
        } catch (error) {
            console.error("Error querying the database:", error);
            res.status(500).json({ error: "Database error." });
        }
    });

    app.post('/api/verify-code', (req, res) => {
        const { phoneNumber, code } = req.body;
    
        // Check if phoneNumber or code is missing
        if (!phoneNumber || !code) {
            return res.status(400).json({ error: "Phone number and verification code are required." });
        }
    
        // Check if the code matches the stored verification code
        if (verificationCodes[phoneNumber] === code) {
            console.log('Code verified successfully.');
            // Delete the verification code after successful verification
            // delete verificationCodes[phoneNumber];
            res.status(200).json({ message: "Code verified successfully." });
        } else {
            res.status(400).json({ error: "Invalid verification code." });
        }
    });

    app.get('/success', (req, res) => {
        res.status(200).json({ message: "Authorization successful! You can close this window or go back to the app." });
    });

    // http://wm.moealsir.tech/authorize?user_id=2&email=mohamedwdalsir@gmail.com

    app.get('/authorize', async (req, res) => {
        const { user_id, email } = req.query;
        console.log("query", req.query);
        // Check for undefined parameters
        if (!user_id || !email) {
            return res.status(400).json({ 'error': 'User ID and email are required.' });
        }

        try {
            const is_authorized = await UserAuthorized(user_id, email);
            if (is_authorized) {
                return res.json({ 'message': 'User is already authorized.' });
            }

            const email_creds = await GetEmailCredentials(email);
            const client_id = email_creds.web.client_id;
            const client_secret = email_creds.web.client_secret;

            const oauth2Client = getOauth2Client(client_id, client_secret, `${BASE_URL}/oauth2callback`);
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                prompt: 'consent',
                scope: SCOPES,
                state: JSON.stringify({ user_id, email })
            });
            res.redirect(authUrl);
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ 'error': `${err.message}` });
        }
    });

    app.get('/oauth2callback', async (req, res) => {
        try {
            const state = JSON.parse(req.query.state);
            const user_id = state.user_id;
            const email = state.email;

            // Check for undefined parameters
            if (!user_id || !email) {
                return res.status(400).json({ 'error': 'User ID and email are required.' });
            }
    
            const email_creds = await GetEmailCredentials(email);
            const client_id = email_creds.web.client_id;
            const client_secret = email_creds.web.client_secret;
    
            const oauth2Client = getOauth2Client(client_id, client_secret, `${BASE_URL}/oauth2callback`);
            const { tokens } = await oauth2Client.getToken(req.query.code);
            await SaveToken(user_id, email, tokens);
            await UpdateAuthorizationStatus(user_id, email, true);
            // console.log(res)
            res.redirect('/success');
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ 'error': 'OAuth2 callback error.' });
        }
    });

    // https.createServer(app).listen(PORT, () => {
    //     console.log(`Server is running on  PORT: ${PORT}`);
    // });

    app.listen(PORT, () => {
        console.log(`Server is running on  PORT: ${PORT}`);
    });

    startCheckingEmails(db);
})();
