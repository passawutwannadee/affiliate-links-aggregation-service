const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Require dotenv
require('dotenv').config();

// Initialize App
const app = express();

// Parse incoming JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Use Cors
app.use(cors());
// app.use(cors({ credentials: true, origin: 'http://192.168.1.36:5173' }));

// Handle images
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

// Use Routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

// Listen Port
const port = process.env.PORT;
const environment = process.env.ENVIRONMENT;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
  console.log(`App listening on env ${environment}`);
  console.log(`Press Ctrl+C to quit.`);
});
