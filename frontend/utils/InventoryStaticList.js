// components/dismantling/DismantlingHelpers.js
export const MATERIALS_LIST = [
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

export const getStatusColor = (status) => {
  const colors = {
    planned: 'bg-slate-100 text-slate-600 border border-slate-200',

    assigned: 'bg-sky-100 text-sky-700 border border-sky-200',

    surveying: 'bg-amber-100 text-amber-700 border border-amber-200',

    dismantling: 'bg-orange-100 text-orange-700 border border-orange-200',

    dispatching: 'bg-indigo-100 text-indigo-700 border border-indigo-200',

    completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',

    'on-hold': 'bg-red-100 text-red-700 border border-red-200',

    pending: 'bg-gray-100 text-gray-600 border border-gray-200',

    'in-progress': 'bg-cyan-100 text-cyan-700 border border-cyan-200',

    'in-transit': 'bg-purple-100 text-purple-700 border border-purple-200',

    received: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
};

export const getTypeColor = (type) => {
  const colors = {
    B2S: 'bg-sky-100 text-sky-700 border border-sky-200',

    StandAlone: 'bg-teal-100 text-teal-700 border border-teal-200',

    OMO: 'bg-violet-100 text-violet-700 border border-violet-200',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
};

export const getConditionColor = (condition) => {
  const colors = {
    excellent: 'text-status-completed',
    good: 'text-status-in-progress',
    fair: 'text-status-pending',
    poor: 'text-status-on-hold',
    scrap: 'text-destructive',
  };
  return colors[condition] || 'text-muted-foreground';
};

export const createEmptyActivity = () => ({
  survey: {
    conductedBy: null,
    surveyDate: '',
    report: '',
    status: 'pending',
    materials: [],
  },
  dismantling: {
    teamLeader: null,
    teamMembers: [],
    startDate: '',
    endDate: '',
    issuesEncountered: '',
    status: 'pending',
    actualMaterials: [],
  },
  dispatch: {
    status: 'pending',
    materials: [],
  },
  documents: [],
  location: [],
  assignment: {
    assignedTo: [],
    assignedBy: null,
    assignedDate: '',
    status: 'pending',
  },
  timeline: {
    plannedStartDate: '',
    plannedEndDate: '',
    actualStartDate: '',
    actualEndDate: '',
    surveyCompletionDate: '',
    dismantlingCompletionDate: '',
    dispatchCompletionDate: '',
  },
  notes: '',
  status: 'planned',
  completionPercentage: 0,
});
