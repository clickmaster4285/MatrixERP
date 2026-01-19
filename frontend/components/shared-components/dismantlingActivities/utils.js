// components/dismantling/utils.js
export const getStatusColor = (status) => {
  const key = String(status || '').toLowerCase().trim();

  const colors = {
    planned: 'bg-slate-50 text-slate-600 border border-slate-200',
    pending: 'bg-slate-50 text-slate-600 border border-slate-200',

    assigned: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    surveying: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    dismantling: 'bg-orange-50 text-orange-700 border border-orange-200',
    dispatching: 'bg-violet-50 text-violet-700 border border-violet-200',

    'in-progress': 'bg-blue-50 text-blue-700 border border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'on-hold': 'bg-red-50 text-red-700 border border-red-200',
  };

  return colors[key] || 'bg-slate-50 text-slate-600 border border-slate-200';
};


export const getTypeColor = (type) => {
  const key = String(type || '').trim();

  const colors = {
    B2S: 'bg-blue-50 text-blue-700 border border-blue-200',
    StandAlone: 'bg-orange-50 text-orange-700 border border-orange-200',
    OMO: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  return colors[key] || 'bg-slate-50 text-slate-600 border border-slate-200';
};
