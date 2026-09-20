// middleware/auth.js
// Authentication & Role-Based Access Control (RBAC) middleware

// Helper to determine role-specific home route
const getRoleHomeUrl = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'labIncharge':
      return '/lab/dashboard';
    case 'requester':
    default:
      return '/requester/dashboard';
  }
};

// Ensure user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  return res.redirect('/auth/login');
};

// Check if user is an Admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied. Administrator privileges required.');
  const role = req.session && req.session.user ? req.session.user.role : null;
  return res.redirect(role ? getRoleHomeUrl(role) : '/auth/login');
};

// Check if user is a Lab In-charge
const isLabIncharge = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'labIncharge') {
    return next();
  }
  req.flash('error', 'Access denied. Lab In-charge privileges required.');
  const role = req.session && req.session.user ? req.session.user.role : null;
  return res.redirect(role ? getRoleHomeUrl(role) : '/auth/login');
};

// Check if user is a Requester (Student/Staff)
const isRequester = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'requester') {
    return next();
  }
  req.flash('error', 'Access denied. Requester privileges required.');
  const role = req.session && req.session.user ? req.session.user.role : null;
  return res.redirect(role ? getRoleHomeUrl(role) : '/auth/login');
};

// Allow both Admin and Lab In-charge
const isAdminOrLabIncharge = (req, res, next) => {
  if (
    req.session &&
    req.session.user &&
    (req.session.user.role === 'admin' || req.session.user.role === 'labIncharge')
  ) {
    return next();
  }
  req.flash('error', 'Access restricted to Laboratory Staff and Administrators.');
  const role = req.session && req.session.user ? req.session.user.role : null;
  return res.redirect(role ? getRoleHomeUrl(role) : '/auth/login');
};

module.exports = {
  isLoggedIn,
  isAdmin,
  isLabIncharge,
  isRequester,
  isAdminOrLabIncharge,
  getRoleHomeUrl
};
