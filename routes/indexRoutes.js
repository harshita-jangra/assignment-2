// routes/indexRoutes.js
// Base root routing

const express = require('express');
const router = express.Router();
const { getRoleHomeUrl } = require('../middleware/auth');

router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(getRoleHomeUrl(req.session.user.role));
  }
  res.redirect('/auth/login');
});

module.exports = router;
