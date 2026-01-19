// controlller/index
const Auth = require("./auth.controller")
const User = require("./user.controller");
const Project = require("./project.controller");
const Site = require("./site.controller");
const Dismantling = require("./dismantlingActivity.controller");
const RelocationActivity = require("./relocationActivity.controller");
const COWActivity = require("./COWActivity.controller");
const Task = require("./task.controller");
const Vendor = require("./vendor.controller")

module.exports = {
  Auth,
  User,
  Project,
  Site,
  Dismantling,
  RelocationActivity,
  COWActivity,
  Task,
  Vendor,
};