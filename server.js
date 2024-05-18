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
    origin: `${process.env.SITE_URL}`,
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
const adminRoutes = require('./routes/adminRoutes');
const cleanWarns = require('./script/cleanWarns');
const cleanCollections = require('./script/cleanCollections');

// Use Routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/collections', collectionRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);

cleanCollections.cleanCollections();
cleanWarns.cleanWarns();

// Listen Port
const port = process.env.PORT;
const environment = process.env.ENVIRONMENT;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
  console.log(`App listening on env ${environment}`);
  console.log(`Press Ctrl+C to quit.`);
});
