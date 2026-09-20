// app.js
// Main entry point for LabVault - Lab Equipment & Asset Issue-Return Tracking System

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const connectDB = require('./config/db');
const User = require('./models/User');
const seedDatabase = require('./seed');

// Import Route Handlers
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const requesterRoutes = require('./routes/requesterRoutes');
const labRoutes = require('./routes/labRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Connect to MongoDB
connectDB().then(async () => {
  // Auto-seed database if no users exist
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Empty database detected. Auto-seeding initial LabVault demo data...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Auto-seed check error:', err.message);
  }
});

// Configure View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Request Parsing Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Express Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'labvault_velvet_burgundy_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'lax'
    }
  })
);

// Connect Flash Messages
app.use(flash());

// Global Template Variables (User Session & Flash Alerts)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.warning_msg = req.flash('warning');
  res.locals.currentPath = req.path;
  next();
});

// Mount Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/requester', requesterRoutes);
app.use('/lab', labRoutes);
app.use('/admin', adminRoutes);

// Custom 404 Handler
app.use((req, res) => {
  res.status(404).render('error', {
    pageTitle: 'Page Not Found — LabVault',
    statusCode: 404,
    message: 'The requested resource or page was not found in LabVault.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Server Error:', err);
  res.status(500).render('error', {
    pageTitle: 'Server Error — LabVault',
    statusCode: 500,
    message: 'An unexpected internal server error occurred.'
  });
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`=======================================================`);
  console.log(`🚀 LABVAULT SERVER RUNNING AT: http://localhost:${PORT}`);
  console.log(`   Velvet Black × Velvet Burgundy Edition`);
  console.log(`=======================================================`);
});

module.exports = app;
