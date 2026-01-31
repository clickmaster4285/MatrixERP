require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const indexRouter = require('./routes/index');
const initializeAllData = require('./utils/initializeData');
const errorHandler = require('./middlewares/errorHandler.middleware');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();

// ✅ CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const HOST = process.env.HOST ;
const PORT = process.env.PORT; 

// Serve static files (uploads folder)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use routes
app.use('/', indexRouter);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server from app
const server = http.createServer(app);


// Main function to start the server
const startServer = async () => {
  try {
    await connectDB();
    await initializeAllData();
    server.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    console.log(
      'Please kill the process using port 5000 or change PORT in .env file'
    );
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});
