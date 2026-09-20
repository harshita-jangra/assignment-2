// controllers/requesterController.js
// Requester portal: browse catalog, view details, submit issue requests, track status

const Asset = require('../models/Asset');
const Request = require('../models/Request');

// Requester Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Fetch user's requests populated with asset details
    const requests = await Request.find({ requester: userId })
      .populate('asset')
      .sort({ requestDate: -1 });

    const now = new Date();

    // Compute user metrics
    const totalRequests = requests.length;
    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const approvedCount = requests.filter(r => r.status === 'Approved').length;
    const issuedCount = requests.filter(r => r.status === 'Issued').length;
    const overdueCount = requests.filter(r => r.status === 'Issued' && new Date(r.expectedReturnDate) < now).length;
    const returnedCount = requests.filter(r => r.status === 'Returned').length;

    // Filter currently issued items and recent 5 requests
    const activeIssues = requests.filter(r => r.status === 'Issued');
    const recentRequests = requests.slice(0, 5);

    res.render('requester/dashboard', {
      pageTitle: 'Requester Dashboard — LabVault',
      stats: {
        totalRequests,
        pendingCount,
        approvedCount,
        issuedCount,
        overdueCount,
        returnedCount
      },
      activeIssues,
      recentRequests,
      user: req.session.user
    });
  } catch (error) {
    console.error('Requester dashboard error:', error);
    req.flash('error', 'Unable to load dashboard data.');
    res.redirect('/auth/login');
  }
};

// Browse Available Equipment
exports.getBrowseAssets = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { assetTag: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query).sort({ availableQuantity: -1, name: 1 });
    const categories = ['Electronics', 'Testing & Measurement', 'Prototyping', 'Computing', 'Soldering', 'General Lab'];

    res.render('requester/browse', {
      pageTitle: 'Browse Lab Equipment — LabVault',
      assets,
      categories,
      selectedCategory: category || 'All',
      searchQuery: search || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Browse assets error:', error);
    req.flash('error', 'Failed to retrieve equipment list.');
    res.redirect('/requester/dashboard');
  }
};

// Equipment Details Page
exports.getAssetDetails = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Requested asset was not found.');
      return res.redirect('/requester/browse');
    }

    res.render('requester/asset-details', {
      pageTitle: `${asset.name} — LabVault`,
      asset,
      user: req.session.user
    });
  } catch (error) {
    console.error('Asset details error:', error);
    req.flash('error', 'Unable to load asset details.');
    res.redirect('/requester/browse');
  }
};

// Submit Equipment Issue Request
exports.postRequestEquipment = async (req, res) => {
  try {
    const { assetId, quantity, purpose, expectedReturnDate } = req.body;
    const userId = req.session.user.id;

    // Validate inputs
    if (!assetId || !quantity || !purpose || !expectedReturnDate) {
      req.flash('error', 'All fields are required to request equipment.');
      return res.redirect(`/requester/assets/${assetId}`);
    }

    const requestedQty = parseInt(quantity, 10);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      req.flash('error', 'Please enter a valid positive quantity.');
      return res.redirect(`/requester/assets/${assetId}`);
    }

    const returnDate = new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (returnDate < today) {
      req.flash('error', 'Expected return date must be today or a future date.');
      return res.redirect(`/requester/assets/${assetId}`);
    }

    // Retrieve asset and verify available stock
    const asset = await Asset.findById(assetId);
    if (!asset) {
      req.flash('error', 'Asset does not exist.');
      return res.redirect('/requester/browse');
    }

    if (requestedQty > asset.availableQuantity) {
      req.flash('error', `You cannot request more units than currently available (${asset.availableQuantity} available).`);
      return res.redirect(`/requester/assets/${assetId}`);
    }

    // Create the pending request
    const newRequest = new Request({
      requester: userId,
      asset: assetId,
      quantity: requestedQty,
      purpose: purpose.trim(),
      expectedReturnDate: returnDate,
      status: 'Pending'
    });

    await newRequest.save();

    req.flash('success', `Equipment request for ${requestedQty}x ${asset.name} submitted successfully! Awaiting Lab In-charge approval.`);
    res.redirect('/requester/my-requests');
  } catch (error) {
    console.error('Request equipment error:', error);
    req.flash('error', 'An error occurred while submitting your request.');
    res.redirect('/requester/browse');
  }
};

// View User's Own Requests
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const requests = await Request.find({ requester: userId })
      .populate('asset')
      .populate('approvedBy', 'name')
      .populate('issuedBy', 'name')
      .sort({ requestDate: -1 });

    res.render('requester/my-requests', {
      pageTitle: 'My Equipment Requests — LabVault',
      requests,
      now: new Date(),
      user: req.session.user
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    req.flash('error', 'Unable to fetch your requests.');
    res.redirect('/requester/dashboard');
  }
};
