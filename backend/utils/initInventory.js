// seed/initInventory.js
const Inventory = require('../models/Inventory.model');
const User = require('../models/user.model');

// copy same list here OR import from a shared file
const MATERIALS_LIST = [
  { id: '1', name: 'Power Cabinet' },
  { id: '2', name: 'SMU/PMU' },
  { id: '3', name: 'PSU Module' },
  { id: '4', name: 'BBU' },
  { id: '5', name: 'UMPT Card' },
  { id: '6', name: 'USCU Card' },
  { id: '7', name: 'UBBP' },
  { id: '8', name: 'UPEU' },
  { id: '9', name: 'UEIU' },
  { id: '10', name: 'EMU' },
  { id: '11', name: 'DDF' },
  { id: '12', name: 'RTN' },
  { id: '13', name: 'IF Card' },
  { id: '14', name: 'DCDU' },
  { id: '15', name: 'Battery Cabinet' },
  { id: '16', name: 'Battery' },
  { id: '17', name: 'GPS Antenna' },
  { id: '18', name: 'RF Antenna' },
  { id: '19', name: 'RRU' },
  { id: '20', name: 'RRU Power Cable' },
  { id: '21', name: 'CPRI Cable' },
  { id: '22', name: 'RF Jumper' },
  { id: '23', name: 'SFP Module' },
  { id: '24', name: 'Dual band Combiner' },
  { id: '25', name: 'Anti interference Filter' },
  { id: '26', name: 'RET Cable' },
  { id: '27', name: 'Antenna Mount' },
  { id: '28', name: 'MW Dish' },
  { id: '29', name: 'ODU' },
  { id: '30', name: 'IF Connector' },
  { id: '31', name: 'IF Cable' },
  { id: '32', name: 'Dish Mount' },
  { id: '33', name: 'Power/Fiber Clamp' },
  { id: '34', name: 'Sun Shade' },
  { id: '35', name: 'ACDB' },
  { id: '36', name: 'Main Breaker' },
  { id: '37', name: 'AC Power Cable' },
  { id: '38', name: 'DC Power Cable' },
  { id: '39', name: 'Grounding Cable' },
  { id: '40', name: 'RRU Grounding Cable' },
  { id: '41', name: 'Bus Bar' },
  { id: '42', name: 'DG Set' },
  { id: '43', name: 'DG Battery' },
  { id: '44', name: 'DG Power Cable' },
  { id: '45', name: 'AC Indoor Unit' },
  { id: '46', name: 'AC Outdoor Unit' },
];

// normalize / generate a code like M0001, M0046
function makeMaterialCode(id) {
  return `M${String(id).padStart(4, '0')}`; // M0001
}

// find a “system” user to satisfy createdBy
async function getSeedUserId() {
  // best: pick a super admin if you have one
  const user =
    (await User.findOne({ role: /director|admin|super/i }).select('_id')) ||
    (await User.findOne().select('_id'));

  if (!user) {
    throw new Error(
      'No users found. Seed users first (initEmployees) before seeding inventory.'
    );
  }
  return user._id;
}

async function initInventory({ minQty = 10 } = {}) {


  const createdBy = await getSeedUserId();

  for (const item of MATERIALS_LIST) {
    // const materialCode = makeMaterialCode(item.id);
    const materialCode = item.id;
    const materialName = item.name.trim();

    // check if already exists
    const exists = await Inventory.findOne({ materialCode }).select('_id');
    if (exists) {
    
      continue;
    }

    await Inventory.create({
      materialCode,
      materialName,
      category: 'others',
      location: 'global',
      locationName: 'Global Store',

      totalQuantity: minQty,
      availableQuantity: minQty,
      allocatedQuantity: 0,

      unit: 'pcs',
      pricePerUnit: '',

      conditionBreakdown: {
        excellent: 0,
        good: minQty,
        fair: 0,
        poor: 0,
        scrap: 0,
      },

      specifications: {},
      sourceHistory: [],

      createdBy,
      lastUpdatedAt: new Date(),
    });

  
  }

}

module.exports = initInventory;
