// components/dismantling/ActivityProgressOverview.jsx

import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Wrench, Truck, CheckCircle2 } from 'lucide-react';

export function ActivityProgressOverview({ activity }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Overall Progress
        </h2>
        <span className="text-2xl font-bold text-sky-600">
          {activity.completionPercentage ?? 0}%
        </span>
      </div>

      <Progress
        value={activity.completionPercentage ?? 0}
        className="h-3 mb-6"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StageCard
          icon={ClipboardCheck}
          label="Survey"
          status={activity.survey?.status}
        />

        <StageCard
          icon={Wrench}
          label="Dismantling"
          status={activity.dismantling?.status}
        />

        <DispatchStageCard dispatch={activity.dispatch} />
      </div>
    </div>
  );
}

//
// ---- StageCard with improved colour system
//

function StageCard({ icon: Icon, label, status }) {
  const { bg, iconBg, text, iconColor } = getColorStyles(status);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${bg} ${text} transition hover:shadow-sm`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-75 capitalize">{status || 'pending'}</p>
      </div>

      {status === 'completed' && (
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      )}
    </div>
  );
}

//
// ---- Dispatch Stage has same styling logic
//

function DispatchStageCard({ dispatch }) {
  const status = dispatch?.status;
  const { bg, iconBg, text, iconColor } = getColorStyles(status);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${bg} ${text} transition hover:shadow-sm`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
      >
        <Truck className={`w-5 h-5 ${iconColor}`} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold">Dispatch</p>
        <p className="text-xs opacity-75 capitalize">{status || 'pending'}</p>
      </div>

      {status === 'completed' && (
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      )}
    </div>
  );
}

//
// ---- Centralised Colour Logic (easy to edit later)
//

function getColorStyles(status) {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-emerald-50 border-emerald-200',
        iconBg: 'bg-emerald-100',
        text: 'text-emerald-800',
        iconColor: 'text-emerald-700',
      };

    case 'in-progress':
      return {
        bg: 'bg-sky-50 border-sky-200',
        iconBg: 'bg-sky-100',
        text: 'text-sky-800',
        iconColor: 'text-sky-700',
      };

    case 'in-transit':
    case 'received':
      return {
        bg: 'bg-indigo-50 border-indigo-200',
        iconBg: 'bg-indigo-100',
        text: 'text-indigo-800',
        iconColor: 'text-indigo-700',
      };

    default:
      return {
        bg: 'bg-slate-50 border-slate-200',
        iconBg: 'bg-slate-100',
        text: 'text-slate-700',
        iconColor: 'text-slate-500',
      };
  }
}
