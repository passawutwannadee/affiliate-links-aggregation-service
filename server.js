const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')


// Require dotenv
require('dotenv').config()

// Initialize App
const app = express()

// Parse incoming JSON requests
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Use Cors
app.use(cors())

// Routes
const authRoutes = require('./routes/authRoutes')

// Use Routes
app.use('/api/auth', authRoutes)

// Listen Port
const port = process.env.PORT
const environment = process.env.ENVIRONMENT
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
  console.log(`App listening on env ${environment}`)
  console.log(`Press Ctrl+C to quit.`)
})
