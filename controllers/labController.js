// controllers/labController.js
// Lab In-charge portal: approve/reject requests, record issue, record return with conditions, track overdue

const Asset = require('../models/Asset');
const Request = require('../models/Request');
const Maintenance = require('../models/Maintenance');

// Lab In-charge Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();

    const [pendingRequests, approvedRequests, issuedRequests, returnedRequests] = await Promise.all([
      Request.find({ status: 'Pending' }).populate('requester').populate('asset').sort({ requestDate: -1 }),
      Request.find({ status: 'Approved' }).populate('requester').populate('asset').sort({ approvedAt: -1 }),
      Request.find({ status: 'Issued' }).populate('requester').populate('asset').sort({ issuedAt: -1 }),
      Request.find({ status: 'Returned' }).populate('requester').populate('asset').sort({ returnedAt: -1 }).limit(5)
    ]);

    // Compute overdue count from issued requests
    const overdueRequests = issuedRequests.filter(r => new Date(r.expectedReturnDate) < now);

    res.render('labIncharge/dashboard', {
      pageTitle: 'Lab In-charge Dashboard — LabVault',
      stats: {
        pendingCount: pendingRequests.length,
        approvedCount: approvedRequests.length,
        issuedCount: issuedRequests.length,
        overdueCount: overdueRequests.length,
        recentReturnsCount: returnedRequests.length
      },
      pendingRequests: pendingRequests.slice(0, 5),
      approvedRequests: approvedRequests.slice(0, 5),
      overdueRequests: overdueRequests.slice(0, 5),
      returnedRequests,
      now,
      user: req.session.user
    });
  } catch (error) {
    console.error('Lab In-charge dashboard error:', error);
    req.flash('error', 'Error loading lab dashboard.');
    res.redirect('/auth/login');
  }
};

// View All Pending Requests
exports.getPendingRequests = async (req, res) => {
  try {
    const pendingRequests = await Request.find({ status: 'Pending' })
      .populate('requester')
      .populate('asset')
      .sort({ requestDate: -1 });

    const approvedRequests = await Request.find({ status: 'Approved' })
      .populate('requester')
      .populate('asset')
      .sort({ approvedAt: -1 });

    res.render('labIncharge/requests', {
      pageTitle: 'Manage Requests — LabVault',
      pendingRequests,
      approvedRequests,
      user: req.session.user
    });
  } catch (error) {
    console.error('Pending requests error:', error);
    req.flash('error', 'Error loading requests.');
    res.redirect('/lab/dashboard');
  }
};

// Approve Request
exports.postApproveRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await Request.findById(requestId).populate('asset');

    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab/requests');
    }

    if (request.status !== 'Pending') {
      req.flash('error', `Cannot approve request with status '${request.status}'.`);
      return res.redirect('/lab/requests');
    }

    // Check available stock before approving
    if (request.quantity > request.asset.availableQuantity) {
      req.flash('error', `Cannot approve: Insufficient stock. Requested: ${request.quantity}, Available: ${request.asset.availableQuantity}`);
      return res.redirect('/lab/requests');
    }

    request.status = 'Approved';
    request.approvedBy = req.session.user.id;
    request.approvedAt = new Date();
    await request.save();

    req.flash('success', `✓ Request approved for ${request.quantity}x ${request.asset.name}. Ready for issue.`);
    res.redirect('/lab/requests');
  } catch (error) {
    console.error('Approve request error:', error);
    req.flash('error', 'Failed to approve request.');
    res.redirect('/lab/requests');
  }
};

// Reject Request
exports.postRejectRequest = async (req, res) => {
  try {
    const { requestId, rejectionReason } = req.body;
    const request = await Request.findById(requestId);

    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab/requests');
    }

    if (request.status !== 'Pending') {
      req.flash('error', 'Only pending requests can be rejected.');
      return res.redirect('/lab/requests');
    }

    request.status = 'Rejected';
    request.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Declined by Lab In-charge.';
    await request.save();

    req.flash('success', 'Request has been rejected.');
    res.redirect('/lab/requests');
  } catch (error) {
    console.error('Reject request error:', error);
    req.flash('error', 'Failed to reject request.');
    res.redirect('/lab/requests');
  }
};

// Record Equipment Issue (Physical Handover)
exports.postRecordIssue = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await Request.findById(requestId);

    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab/requests');
    }

    if (request.status !== 'Approved') {
      req.flash('error', 'Only approved requests can be issued.');
      return res.redirect('/lab/requests');
    }

    const asset = await Asset.findById(request.asset);
    if (!asset) {
      req.flash('error', 'Associated asset not found.');
      return res.redirect('/lab/requests');
    }

    // Verify stock availability
    if (asset.availableQuantity < request.quantity) {
      req.flash('error', `Cannot issue: Available stock (${asset.availableQuantity}) is less than requested quantity (${request.quantity}).`);
      return res.redirect('/lab/requests');
    }

    // Business Logic: Decrease available stock, Increase issued stock
    asset.availableQuantity -= request.quantity;
    asset.issuedQuantity += request.quantity;
    await asset.save();

    // Update request state
    request.status = 'Issued';
    request.issuedBy = req.session.user.id;
    request.issuedAt = new Date();
    await request.save();

    req.flash('success', `✓ Equipment issued: ${request.quantity}x ${asset.name}. Available quantity updated to ${asset.availableQuantity}.`);
    res.redirect('/lab/issued');
  } catch (error) {
    console.error('Record issue error:', error);
    req.flash('error', 'Failed to record equipment issue.');
    res.redirect('/lab/requests');
  }
};

// View Currently Issued Equipment
exports.getIssuedEquipment = async (req, res) => {
  try {
    const issuedRequests = await Request.find({ status: 'Issued' })
      .populate('requester')
      .populate('asset')
      .sort({ issuedAt: -1 });

    res.render('labIncharge/issued', {
      pageTitle: 'Currently Issued Equipment — LabVault',
      issuedRequests,
      now: new Date(),
      user: req.session.user
    });
  } catch (error) {
    console.error('Get issued equipment error:', error);
    req.flash('error', 'Failed to load issued equipment.');
    res.redirect('/lab/dashboard');
  }
};

// View Overdue Equipment
exports.getOverdueEquipment = async (req, res) => {
  try {
    const now = new Date();
    const allIssued = await Request.find({ status: 'Issued' })
      .populate('requester')
      .populate('asset')
      .sort({ expectedReturnDate: 1 });

    // Filter items where expected return date has passed
    const overdueRequests = allIssued.filter(r => new Date(r.expectedReturnDate) < now);

    res.render('labIncharge/overdue', {
      pageTitle: 'Overdue Equipment Monitor — LabVault',
      overdueRequests,
      now,
      user: req.session.user
    });
  } catch (error) {
    console.error('Overdue equipment error:', error);
    req.flash('error', 'Failed to load overdue equipment.');
    res.redirect('/lab/dashboard');
  }
};

// Record Equipment Return
exports.postRecordReturn = async (req, res) => {
  try {
    const { requestId, returnCondition, returnRemarks } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      req.flash('error', 'Request not found.');
      return res.redirect('/lab/issued');
    }

    if (request.status !== 'Issued') {
      req.flash('error', 'Only issued equipment can be marked as returned.');
      return res.redirect('/lab/issued');
    }

    const asset = await Asset.findById(request.asset);
    if (!asset) {
      req.flash('error', 'Asset not found.');
      return res.redirect('/lab/issued');
    }

    const validConditions = ['OK', 'Damaged', 'Lost'];
    const selectedCondition = validConditions.includes(returnCondition) ? returnCondition : 'OK';

    // Update Request Record
    request.status = 'Returned';
    request.returnedAt = new Date();
    request.returnCondition = selectedCondition;
    request.returnRemarks = returnRemarks ? returnRemarks.trim() : '';
    await request.save();

    // Critical Business Logic: Quantity & Condition Updates
    asset.issuedQuantity = Math.max(0, asset.issuedQuantity - request.quantity);

    if (selectedCondition === 'OK') {
      // Normal Return: Restore stock to available pool
      asset.availableQuantity += request.quantity;
      req.flash('success', `✓ Equipment returned in OK condition. ${request.quantity} unit(s) restored to available stock.`);
    } else if (selectedCondition === 'Damaged') {
      // Damaged Return: Do NOT restore to available pool!
      asset.damagedQuantity += request.quantity;
      asset.condition = 'Damaged';

      // Automatically create a maintenance log for tracking
      const maintenanceRecord = new Maintenance({
        asset: asset._id,
        serviceDate: new Date(),
        description: `Damage reported on return by ${request.requester}. Remarks: ${returnRemarks || 'Physical defect observed.'}`,
        cost: 0,
        status: 'Scheduled',
        notes: `Returned damaged from issue request #${request._id.toString().slice(-6)}`
      });
      await maintenanceRecord.save();

      req.flash('warning', `! Equipment returned DAMAGED. Units isolated from available stock and flagged for maintenance.`);
    } else if (selectedCondition === 'Lost') {
      // Lost Return: Deduct from total inventory and isolate
      asset.lostQuantity += request.quantity;
      asset.totalQuantity = Math.max(0, asset.totalQuantity - request.quantity);

      req.flash('error', `✕ Equipment recorded as LOST. Total institutional inventory reduced by ${request.quantity} unit(s).`);
    }

    await asset.save();
    res.redirect('/lab/issued');
  } catch (error) {
    console.error('Record return error:', error);
    req.flash('error', 'Failed to record return.');
    res.redirect('/lab/issued');
  }
};
