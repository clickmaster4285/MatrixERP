// models/index.js
const User = require('./user.model');
const Project = require('./Project.model');
const Site = require('./Site.model');
const dismantling = require('./dismantlingActivity.model');
const RelocationActivity = require('./RelocationActivity.model');
const COWActivity = require('./COWActivity.model');
const Inventory = require('./Inventory.model');
const Vendor = require('./vendor.model');
const DasIbsAtivity = require('./DasIbsActivity.model');

module.exports = {
  User,
  Site,
  Project,
  dismantling,
  RelocationActivity,
  COWActivity,
  Inventory,
  Vendor,
  DasIbsAtivity,
};
