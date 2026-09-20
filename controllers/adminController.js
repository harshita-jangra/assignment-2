// controllers/adminController.js
// Admin portal: Executive dashboard, full asset CRUD, user management, maintenance logs

const Asset = require('../models/Asset');
const Request = require('../models/Request');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');

// Admin Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();

    const [assets, requests, users, maintenanceLogs] = await Promise.all([
      Asset.find(),
      Request.find().populate('requester').populate('asset').sort({ requestDate: -1 }),
      User.find().select('-password'),
      Maintenance.find().populate('asset').sort({ serviceDate: -1 })
    ]);

    // Aggregate inventory counts
    let totalUnits = 0;
    let availableUnits = 0;
    let issuedUnits = 0;
    let damagedUnits = 0;
    let lostUnits = 0;

    assets.forEach(a => {
      totalUnits += a.totalQuantity || 0;
      availableUnits += a.availableQuantity || 0;
      issuedUnits += a.issuedQuantity || 0;
      damagedUnits += a.damagedQuantity || 0;
      lostUnits += a.lostQuantity || 0;
    });

    // Request metrics
    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const approvedCount = requests.filter(r => r.status === 'Approved').length;
    const issuedCount = requests.filter(r => r.status === 'Issued').length;
    const overdueRequests = requests.filter(r => r.status === 'Issued' && new Date(r.expectedReturnDate) < now);
    const returnedCount = requests.filter(r => r.status === 'Returned').length;

    // Recent events
    const recentRequests = requests.slice(0, 5);
    const recentIssues = requests.filter(r => r.status === 'Issued').slice(0, 5);
    const recentReturns = requests.filter(r => r.status === 'Returned').slice(0, 5);
    const upcomingMaintenance = maintenanceLogs.filter(m => m.status !== 'Completed').slice(0, 5);

    res.render('admin/dashboard', {
      pageTitle: 'Admin Dashboard — LabVault',
      stats: {
        totalAssets: assets.length,
        totalUnits,
        availableUnits,
        issuedUnits,
        damagedUnits,
        lostUnits,
        pendingCount,
        approvedCount,
        issuedCount,
        overdueCount: overdueRequests.length,
        returnedCount,
        totalUsers: users.length
      },
      recentRequests,
      recentIssues,
      recentReturns,
      overdueRequests: overdueRequests.slice(0, 5),
      upcomingMaintenance,
      now,
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Error loading administrative dashboard.');
    res.redirect('/auth/login');
  }
};

// View All Assets
exports.getAssets = async (req, res) => {
  try {
    const { category, search, condition } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (condition && condition !== 'All') {
      filter.condition = condition;
    }
    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { assetTag: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const assets = await Asset.find(filter).sort({ name: 1 });
    const categories = ['Electronics', 'Testing & Measurement', 'Prototyping', 'Computing', 'Soldering', 'General Lab'];

    res.render('admin/assets', {
      pageTitle: 'Asset Inventory — LabVault',
      assets,
      categories,
      selectedCategory: category || 'All',
      selectedCondition: condition || 'All',
      searchQuery: search || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin get assets error:', error);
    req.flash('error', 'Failed to retrieve asset list.');
    res.redirect('/admin/dashboard');
  }
};

// Render Add Asset Form
exports.getAddAsset = (req, res) => {
  const categories = ['Electronics', 'Testing & Measurement', 'Prototyping', 'Computing', 'Soldering', 'General Lab'];
  res.render('admin/asset-form', {
    pageTitle: 'Add New Asset — LabVault',
    categories,
    asset: {},
    isEditing: false,
    user: req.session.user
  });
};

// Handle Add Asset Submission
exports.postAddAsset = async (req, res) => {
  try {
    const { assetTag, name, category, location, totalQuantity, condition, description, image } = req.body;

    // Validation
    if (!assetTag || !name || !category || !location || !totalQuantity) {
      req.flash('error', 'Please fill in all mandatory asset details.');
      return res.redirect('/admin/assets/add');
    }

    const tag = assetTag.toUpperCase().trim();
    const existingAsset = await Asset.findOne({ assetTag: tag });
    if (existingAsset) {
      req.flash('error', `An asset with tag "${tag}" already exists.`);
      return res.redirect('/admin/assets/add');
    }

    const qty = parseInt(totalQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      req.flash('error', 'Total quantity must be a non-negative number.');
      return res.redirect('/admin/assets/add');
    }

    const newAsset = new Asset({
      assetTag: tag,
      name: name.trim(),
      category,
      location: location.trim(),
      totalQuantity: qty,
      availableQuantity: qty,
      issuedQuantity: 0,
      damagedQuantity: 0,
      lostQuantity: 0,
      condition: condition || 'Good',
      description: description ? description.trim() : '',
      image: image && image.trim() !== '' ? image.trim() : '/images/default-asset.svg'
    });

    await newAsset.save();

    req.flash('success', `✓ Asset "${newAsset.name}" [${newAsset.assetTag}] created successfully!`);
    res.redirect('/admin/assets');
  } catch (error) {
    console.error('Add asset error:', error);
    req.flash('error', 'Failed to create asset. Check all fields.');
    res.redirect('/admin/assets/add');
  }
};

// Render Edit Asset Form
exports.getEditAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    const categories = ['Electronics', 'Testing & Measurement', 'Prototyping', 'Computing', 'Soldering', 'General Lab'];
    res.render('admin/asset-form', {
      pageTitle: `Edit ${asset.name} — LabVault`,
      categories,
      asset,
      isEditing: true,
      user: req.session.user
    });
  } catch (error) {
    console.error('Edit asset form error:', error);
    req.flash('error', 'Failed to load asset for editing.');
    res.redirect('/admin/assets');
  }
};

// Handle Edit Asset Submission
exports.postEditAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    const { assetTag, name, category, location, totalQuantity, condition, description, image } = req.body;

    const newTotal = parseInt(totalQuantity, 10);
    if (isNaN(newTotal) || newTotal < 0) {
      req.flash('error', 'Total quantity must be a non-negative number.');
      return res.redirect(`/admin/assets/${asset._id}/edit`);
    }

    // Minimum total quantity cannot be less than currently issued + damaged + lost
    const nonAvailableUnits = (asset.issuedQuantity || 0) + (asset.damagedQuantity || 0) + (asset.lostQuantity || 0);
    if (newTotal < nonAvailableUnits) {
      req.flash('error', `Cannot set total quantity below ${nonAvailableUnits} (Issued: ${asset.issuedQuantity}, Damaged: ${asset.damagedQuantity}, Lost: ${asset.lostQuantity}).`);
      return res.redirect(`/admin/assets/${asset._id}/edit`);
    }

    // Check unique tag if modified
    const tag = assetTag.toUpperCase().trim();
    if (tag !== asset.assetTag) {
      const duplicate = await Asset.findOne({ assetTag: tag });
      if (duplicate) {
        req.flash('error', `Asset tag "${tag}" is already assigned to another item.`);
        return res.redirect(`/admin/assets/${asset._id}/edit`);
      }
      asset.assetTag = tag;
    }

    asset.name = name.trim();
    asset.category = category;
    asset.location = location.trim();
    asset.totalQuantity = newTotal;
    asset.availableQuantity = newTotal - nonAvailableUnits;
    asset.condition = condition || asset.condition;
    asset.description = description ? description.trim() : asset.description;
    if (image && image.trim() !== '') {
      asset.image = image.trim();
    }

    await asset.save();

    req.flash('success', `✓ Asset "${asset.name}" updated successfully.`);
    res.redirect('/admin/assets');
  } catch (error) {
    console.error('Update asset error:', error);
    req.flash('error', 'Failed to update asset.');
    res.redirect('/admin/assets');
  }
};

// Handle Delete Asset
exports.postDeleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/assets');
    }

    if (asset.issuedQuantity > 0) {
      req.flash('error', `Cannot delete asset "${asset.name}". There are currently ${asset.issuedQuantity} unit(s) issued to requesters.`);
      return res.redirect('/admin/assets');
    }

    await Asset.findByIdAndDelete(req.params.id);
    req.flash('success', `✓ Asset "${asset.name}" deleted successfully.`);
    res.redirect('/admin/assets');
  } catch (error) {
    console.error('Delete asset error:', error);
    req.flash('error', 'Failed to delete asset.');
    res.redirect('/admin/assets');
  }
};

// Master Audit Table of All Requests
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }

    const requests = await Request.find(filter)
      .populate('requester')
      .populate('asset')
      .populate('approvedBy', 'name')
      .populate('issuedBy', 'name')
      .sort({ requestDate: -1 });

    res.render('admin/requests', {
      pageTitle: 'All System Requests — LabVault',
      requests,
      selectedStatus: status || 'All',
      now: new Date(),
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin all requests error:', error);
    req.flash('error', 'Error loading request audit trail.');
    res.redirect('/admin/dashboard');
  }
};

// User Directory
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.render('admin/users', {
      pageTitle: 'User Directory — LabVault',
      users,
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin users error:', error);
    req.flash('error', 'Error loading user list.');
    res.redirect('/admin/dashboard');
  }
};

// Maintenance Records
exports.getMaintenance = async (req, res) => {
  try {
    const [maintenanceLogs, assets] = await Promise.all([
      Maintenance.find().populate('asset').sort({ serviceDate: -1 }),
      Asset.find().sort({ name: 1 })
    ]);

    let totalCost = 0;
    maintenanceLogs.forEach(m => totalCost += (m.cost || 0));

    res.render('admin/maintenance', {
      pageTitle: 'Maintenance & Servicing — LabVault',
      maintenanceLogs,
      assets,
      totalCost,
      user: req.session.user
    });
  } catch (error) {
    console.error('Admin maintenance error:', error);
    req.flash('error', 'Error loading maintenance records.');
    res.redirect('/admin/dashboard');
  }
};

// Add Maintenance Record
exports.postAddMaintenance = async (req, res) => {
  try {
    const { assetId, serviceDate, description, cost, nextServiceDue, status, notes, restoreToStock } = req.body;

    if (!assetId || !description) {
      req.flash('error', 'Asset and service description are required.');
      return res.redirect('/admin/maintenance');
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/admin/maintenance');
    }

    const newLog = new Maintenance({
      asset: assetId,
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      description: description.trim(),
      cost: parseFloat(cost) || 0,
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
      status: status || 'Scheduled',
      notes: notes ? notes.trim() : ''
    });

    await newLog.save();

    // If marked Completed and option to restore stock is checked
    if (status === 'Completed' && restoreToStock === 'yes') {
      if (asset.damagedQuantity > 0) {
        asset.damagedQuantity -= 1;
        asset.availableQuantity += 1;
      }
      asset.condition = 'Good';
      await asset.save();
      req.flash('success', `✓ Maintenance recorded and 1 unit restored to operational stock for ${asset.name}.`);
    } else {
      req.flash('success', `✓ Maintenance record logged for ${asset.name}.`);
    }

    res.redirect('/admin/maintenance');
  } catch (error) {
    console.error('Add maintenance error:', error);
    req.flash('error', 'Failed to log maintenance record.');
    res.redirect('/admin/maintenance');
  }
};
