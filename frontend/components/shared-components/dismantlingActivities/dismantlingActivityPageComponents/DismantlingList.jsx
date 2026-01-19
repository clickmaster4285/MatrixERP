// components/dismantling/DismantlingList.jsx
'use client';

import DismantlingCard from './DismantlingCard';

const DismantlingList = ({ activities, onDelete, onOpenDetail }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {activities.map((activity) => (
        <DismantlingCard
          key={activity._id}
          activity={activity}
          onDelete={onDelete}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
};

export default DismantlingList;
