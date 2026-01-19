// seed/initEmployees.js
const User = require('../models/user.model');

// Your given list (Sr.No becomes EMP id)
const EMPLOYEES = [
  { sr: 1, name: 'Karim Khan', designation: 'Director-Projects' },
  { sr: 2, name: 'Imran Anwar', designation: 'Project-Manager' },
  { sr: 3, name: 'Zubair Abdul Khaliq', designation: 'Project-Manager' },
  { sr: 4, name: 'Muhammad Imran', designation: 'Regional Project-manger' },
  { sr: 5, name: 'Fakher Sohail', designation: 'supervisor-civil' },
  { sr: 6, name: 'Muhammad Atif', designation: 'RAN-Engineer' },
  { sr: 7, name: 'Muhammad Shehzad', designation: 'Transmission-Engineer' },
  { sr: 8, name: 'Muzamil Hussain', designation: 'RF-Engineer' },
  { sr: 9, name: 'Mohsin Javed', designation: 'Project-Coordinator' },
  { sr: 10, name: 'Zoyouf ur Rehman', designation: 'Engineer-civil' },
  { sr: 11, name: 'Attiq Ahmed', designation: 'Regional Project-manger' },
  { sr: 12, name: 'Muhammad Waqas', designation: 'Reger-Technician' },
  { sr: 13, name: 'Khalil Ahmed', designation: 'Reger-Technician' },
  { sr: 14, name: 'Aftab Ahmed', designation: 'Technician' },
  { sr: 15, name: 'Muhammad Arsalan', designation: 'DT-Engineer' },
  { sr: 16, name: 'Muhammad Waqas', designation: 'DT-Engineer' },
  { sr: 17, name: 'Waleed Ijaz', designation: 'Store-Inchage' },
  { sr: 18, name: 'Azmat Khan', designation: 'Office-Boy' },
  { sr: 19, name: 'Qaiser Jamal', designation: 'Office-Boy' },
  { sr: 20, name: 'Muhammad Ramzan', designation: 'Office-Boy' },
  { sr: 21, name: 'Azam Khan', designation: 'Internee' },
];

// phone generator
function makeDummyPhone(sr) {
  return `0300${String(sr).padStart(7, '0')}`;
}

// password generator
function makePasswordFromFirstName(fullName) {
  const first = String(fullName).trim().split(' ')[0];
  if (first.length >= 6) return first;
  return `${first}123`;
}

// ✅ ROLE NORMALIZER (THIS IS THE FIX)
function normalizeRole(designation) {
  return String(designation)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // spaces → hyphen
    .replace('manger', 'manager') // fix typo
    .replace('inchage', 'incharge'); // fix typo
}

async function initEmployees() {


  for (const emp of EMPLOYEES) {
    const employeeId = `EMP${String(emp.sr).padStart(3, '0')}`;
    const phone = makeDummyPhone(emp.sr);

    const exists = await User.findOne({
      $or: [{ employeeId }, { phone }],
    }).select('_id');

    if (exists) {
     
      continue;
    }

    const normalizedRole = normalizeRole(emp.designation);

    await User.create({
      employeeId,
      name: emp.name.trim(),
      phone,
      email: undefined,
      password: makePasswordFromFirstName(emp.name),
      role: normalizedRole,        
      department: normalizedRole,  
      isActive: true,
    });

    
  }
}

module.exports = initEmployees;
