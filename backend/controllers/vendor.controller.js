const Vendor = require('../models/vendor.model'); // ✅ match filename exactly

const canManage = (user) => user?.role === 'admin';

// ===================== CREATE =====================
exports.createVendor = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res
        .status(403)
        .json({ success: false, message: 'Only admin can create vendors' });
    }

    const {
      name,
      vendorCode,
      type,
      contactPerson,
      phone,
      email,
      address,
      city,
      country,
      taxNumber,
      registrationNumber,
      notes,
    } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: 'Vendor name is required' });
    }

    const vendor = await Vendor.create({
      name,
      vendorCode: vendorCode ? vendorCode.toUpperCase().trim() : undefined,
      type,
      contactPerson,
      phone,
      email,
      address,
      city,
      country,
      taxNumber,
      registrationNumber,
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id,

      // ✅ new vendor should NOT be deleted
      isDeleted: false,
    });

    return res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===================== GET ALL =====================
// default: do not show deleted vendors
// admin can use ?includeDeleted=true
exports.getVendors = async (req, res) => {
  try {
    const {
      search = '',
      type,
      includeDeleted = 'false',
      page = 1,
      limit = 20,
    } = req.query;

    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const query = {};

    if (type) query.type = type;

    // ✅ exclude deleted by default
    const showDeleted = includeDeleted === 'true' && req.user.role === 'admin';
    if (!showDeleted) query.isDeleted = false;

    if (search) {
      const r = new RegExp(search, 'i');
      query.$or = [
        { name: { $regex: r } },
        { vendorCode: { $regex: r } },
        { phone: { $regex: r } },
        { email: { $regex: r } },
        { city: { $regex: r } },
      ];
    }

    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Vendor.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: vendors.length,
      total,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        pages: Math.ceil(total / numericLimit) || 1,
      },
      data: vendors,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===================== GET ONE =====================
// do not allow fetching deleted unless admin asks ?includeDeleted=true
exports.getVendorById = async (req, res) => {
  try {
    const { includeDeleted = 'false' } = req.query;

    const vendor = await Vendor.findById(req.params.id).lean();
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: 'Vendor not found' });
    }

    if (
      vendor.isDeleted &&
      !(includeDeleted === 'true' && req.user.role === 'admin')
    ) {
      return res
        .status(404)
        .json({ success: false, message: 'Vendor not found' });
    }

    return res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===================== UPDATE =====================
exports.updateVendor = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res
        .status(403)
        .json({ success: false, message: 'Only admin can update vendors' });
    }

    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor || vendor.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Vendor not found' });
    }

    const allowed = [
      'name',
      'vendorCode',
      'type',
      'contactPerson',
      'phone',
      'email',
      'address',
      'city',
      'country',
      'taxNumber',
      'registrationNumber',
      'notes',
    ];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) vendor[key] = req.body[key];
    });

    if (vendor.vendorCode)
      vendor.vendorCode = vendor.vendorCode.toUpperCase().trim();

    vendor.updatedBy = req.user.id;
    await vendor.save();

    return res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===================== DELETE (SOFT) =====================
exports.deleteVendor = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res
        .status(403)
        .json({ success: false, message: 'Only admin can delete vendors' });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: 'Vendor not found' });
    }

    vendor.isDeleted = true;
    vendor.deletedAt = new Date();
    vendor.deletedBy = req.user.id;
    vendor.updatedBy = req.user.id;

    await vendor.save();

    return res
      .status(200)
      .json({ success: true, message: 'Vendor soft deleted successfully' });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};


// ===================== DROPDOWN =====================
exports.getVendorDropdown = async (req, res) => {
  try {
    const vendors = await Vendor.find({ isDeleted: false })
      .select('name vendorCode type')
      .sort({ name: 1 })
      .lean();

    return res
      .status(200)
      .json({ success: true, data: vendors, count: vendors.length });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};
