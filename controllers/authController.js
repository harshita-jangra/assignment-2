// controllers/authController.js
// Authentication logic: Login, Registration, Logout, and Session Management

const User = require('../models/User');
const { getRoleHomeUrl } = require('../middleware/auth');

// Render Login Page
exports.getLogin = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(getRoleHomeUrl(req.session.user.role));
  }
  res.render('auth/login', {
    pageTitle: 'Sign In — LabVault',
    formData: {}
  });
};

// Handle Login Submission
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      req.flash('error', 'Please provide both email and password.');
      return res.render('auth/login', {
        pageTitle: 'Sign In — LabVault',
        formData: { email }
      });
    }

    // Find user by lowercase email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error', 'Invalid email address or password.');
      return res.render('auth/login', {
        pageTitle: 'Sign In — LabVault',
        formData: { email }
      });
    }

    // Compare password with bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email address or password.');
      return res.render('auth/login', {
        pageTitle: 'Sign In — LabVault',
        formData: { email }
      });
    }

    // Save session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    req.flash('success', `Welcome back, ${user.name}!`);
    return res.redirect(getRoleHomeUrl(user.role));
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An unexpected error occurred during sign-in.');
    return res.redirect('/auth/login');
  }
};

// Render Register Page
exports.getRegister = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(getRoleHomeUrl(req.session.user.role));
  }
  res.render('auth/register', {
    pageTitle: 'Create Account — LabVault',
    formData: {}
  });
};

// Handle Register Submission
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, department } = req.body;

    // Validation
    if (!name || !email || !password) {
      req.flash('error', 'Please fill in all required fields.');
      return res.render('auth/register', {
        pageTitle: 'Create Account — LabVault',
        formData: { name, email, role, department }
      });
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long.');
      return res.render('auth/register', {
        pageTitle: 'Create Account — LabVault',
        formData: { name, email, role, department }
      });
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.render('auth/register', {
        pageTitle: 'Create Account — LabVault',
        formData: { name, email, role, department }
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'This email address is already registered. Please sign in.');
      return res.render('auth/register', {
        pageTitle: 'Create Account — LabVault',
        formData: { name, email, role, department }
      });
    }

    // Determine allowed role (default to requester, allow labIncharge or requester from public register)
    const assignedRole = (role === 'labIncharge' || role === 'requester') ? role : 'requester';

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      department: department ? department.trim() : 'General Laboratory'
    });

    await newUser.save();

    // Auto log in after registration
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department
    };

    req.flash('success', `Account created successfully! Welcome to LabVault, ${newUser.name}.`);
    return res.redirect(getRoleHomeUrl(newUser.role));
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'An error occurred while creating your account.');
    return res.redirect('/auth/register');
  }
};

// Handle Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/auth/login');
  });
};
