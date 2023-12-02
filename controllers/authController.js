const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../database/db');
const uuid = require('uuid');
const transporter = require('../utils/email');

// Register function
const register = async (req, res) => {
  const { email, password, username } = req.body;
  let display_name = req.body.display_name;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!display_name) {
    display_name = username;
  }

  // Password complexity regex pattern
  // Password must be at least 8 characters long and contain at least one number, one lowercase letter, one uppercase letter, and one symbol (@$!%*?&)
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Check if the password meets the complexity requirements
  if (!passwordPattern.test(password)) {
    return res.status(400).json({
      message:
        'Password must be at least 8 characters long and contain at least one number, one lowercase letter, one uppercase letter, and one symbol (@$!%*?&)',
    });
  }

  try {
    // Check if the email already exists by searching for the email
    const existingEmail = await db('users').where('email', email).first();

    if (existingEmail) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Check if the user already exists by searching for username
    const existingUser = await db('users').where('username', username).first();

    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // salt password 10 rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique verification token for the user
    const email_verify_token = uuid.v4();

    // insert user
    const result = await db('users').insert({
      email,
      password: hashedPassword,
      display_name,
      username,
      email_verify_token,
    });

    if (result.length === 1) {
      // Send a verification email to the user
      const mailOptions = {
        from: process.env.EMAIL_USER, // Your email address
        to: email,
        subject: 'Email Verification',
        text: `To verify your email, click the following link: http://your-website.com/verify/${email_verify_token}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).json({
            message: 'An error occurred while sending the verification email',
          });
        }

        console.log(`Verification email sent: ${info.response}`);
        return res.status(201).json({
          message:
            'User registered successfully. Check your email for verification.',
        });
      });
    } else {
      return res.status(500).json({ message: err });
    }
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};

// Login Function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // get user's password from db
    const queryPassword = await db('users').select('*').where('email', email);

    // if email doesn't exist return status 400
    if (queryPassword.length === 0) {
      res
        .status(200)
        .send({ login: false, message: 'Incorrect email or password' });
    }

    if (queryPassword.length === 1) {
      const passwordResult = await bcrypt.compare(
        password,
        queryPassword[0]?.password
      );

      console.log(passwordResult);

      if (!passwordResult) {
        res
          .status(200)
          .send({ login: false, message: 'Incorrect email or password' });
      }

      if (passwordResult) {
        const loginResult = await db('users')
          .select('user_id', 'username', 'role_id', 'email_verify')
          .where('email', email);
        console.log(loginResult[0]);

        const token = jwt.sign(
          { username: loginResult.user_id },
          process.env.JWT_SECRET,
          {
            expiresIn: '60m',
          }
        );
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
        });
        res
          .status(200)
          .json({ login: true, token: token, result: loginResult[0] });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

// verifyEmail Function
const verifyEmail = async (req, res) => {
  const { email_verify_token } = req.body;

  if (!email_verify_token) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const getUser = await db('users')
      .select('user_id')
      .where('email_verify_token', email_verify_token);

    const verify = await db('users')
      .where('user_id', getUser[0].user_id)
      .update({
        email_verify_token: null,
        email_verify: 1,
      });
    res.status(200).json({ message: 'Successfully verified email.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
};
