const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// Require dotenv
require('dotenv').config();

// Initialize App
const app = express();

// Parse incoming JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Use Cors
// app.use(cors());
app.use(
  cors({
    credentials: true,
    origin: 'http://192.168.1.36:5173',
  })
);

// Handle images
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Use Routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/collections', collectionRoutes);
app.use('/reports', reportRoutes);

// Listen Port
const port = process.env.PORT;
const environment = process.env.ENVIRONMENT;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
  console.log(`App listening on env ${environment}`);
  console.log(`Press Ctrl+C to quit.`);
});
