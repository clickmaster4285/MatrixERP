// utils/initializeData.js
const fs = require('fs');
const path = require('path');

const initializeAdmin = require('./inatializeAdmin');
const initEmployees = require('./initEmployees');
const initInventory = require('./initInventory');

const User = require('../models/user.model');
const Inventory = require('../models/Inventory.model');

const MARKER_PATH = path.join(process.cwd(), '.dev-seed-done');

const initializeAllData = async () => {
  try {
    // ✅ If DB is empty, force seed (even if marker exists)
    const usersCount = await User.countDocuments();
    const invCount = await Inventory.countDocuments();

    const dbIsEmpty = usersCount === 0 || invCount === 0;

    // ✅ Normal behavior: seed only once per dev run
    if (!dbIsEmpty && fs.existsSync(MARKER_PATH)) return;

    // create marker early to avoid double-run on quick restarts
    if (!fs.existsSync(MARKER_PATH)) {
      fs.writeFileSync(MARKER_PATH, `seeded_at=${new Date().toISOString()}\n`);
    }



    await initializeAdmin();
    await initEmployees();
    await initInventory({ minQty: 10 });

 
  } catch (error) {
    console.error('❌ Error during data initialization:', error);

    // if failed, remove marker so it can retry next start
    try {
      if (fs.existsSync(MARKER_PATH)) fs.unlinkSync(MARKER_PATH);
    } catch (_) {}
  }
};

module.exports = initializeAllData;
