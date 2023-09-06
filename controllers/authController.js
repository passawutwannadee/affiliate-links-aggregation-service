const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const db = require("../database/db")
const uuid = require('uuid');
const transporter = require("../utils/email");

// Register function
const register = async(req, res) => { 

    const { email, password, display_name, username } = req.body;

    if (!email || !password || !display_name || !username ) {
        return res.status(400).json({ message: 'All fields are required' });
    };

    // Password complexity regex pattern
    // Password must be at least 8 characters long and contain at least one number, one lowercase letter, one uppercase letter, and one symbol (@$!%*?&)
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // Check if the password meets the complexity requirements
    if (!passwordPattern.test(password)) {
        return res.status(400).json({
            message:
            'Password must be at least 8 characters long and contain at least one number, one lowercase letter, one uppercase letter, and one symbol (@$!%*?&)',
        });
    };

    

    try {
        // Check if the email already exists by searching for the email
        const existingEmail = await db('users')
        .where('email', email)
        .first();

        if (existingEmail) {
        return res.status(409).json({ message: 'Email already exists' });
        };

        // Check if the user already exists by searching for username
        const existingUser = await db('users')
        .where('username', username)
        .first();

        if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
        };

        // salt password 10 rounds
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique verification token for the user
        const email_verify_token = uuid.v4();

        console.log("---------------------------------1")

        // insert user
        const result = await db('users').insert({
            email,
            password: hashedPassword,
            display_name,
            username,
            email_verify_token
          });

        if (result.length === 1) {

            console.log("---------------------------------2")
            
            // Send a verification email to the user
            const mailOptions = {
            from: process.env.EMAIL_USER, // Your email address
            to: email,
            subject: 'Email Verification',
            text: `To verify your email, click the following link: http://your-website.com/verify/${email_verify_token}`,
            };

            
            console.log("---------------------------------3")
    
            transporter.sendMail(mailOptions, (error, info) => {

            if (error) {
                
            console.log("---------------------------------4")
                console.error(error);
                return res.status(500).json({ message: 'An error occurred while sending the verification email' });
            }
            
            console.log("---------------------------------5")
            console.log(`Verification email sent: ${info.response}`);
            return res.status(201).json({ message: 'User registered successfully. Check your email for verification.' });
            });
        } else {
            return res.status(500).json({ message: err });
        }

    } catch (err) {
        return res.status(500).json({ message: err });
    }
};

// verifyEmail Function
const verifyEmail = (req, res) => { 

    const { email, password  } = req.body;

};

// Login Function
const login = (req, res) => { 

    const { email, password  } = req.body;

};

module.exports = {
    register
  }