// components/shared-components/tasks/TaskList.jsx
import { TaskCard } from './TaskCard';
import { Inbox, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';


export const TaskList = ({ tasks, isLoading, onOpen }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-sm">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <Inbox className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium mb-1">No tasks found</h3>
        <p className="text-sm">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  const router = useRouter();

  const handleClick = (task) => {
    router.push(`/admin/tasks/${task._id}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-4">
      {tasks.map((task, index) => (
        // Use _id instead of activityId
        <div onClick={() => handleClick(task)}>
          <TaskCard key={task._id} task={task} index={index} />
        </div>
      ))}
    </div>
  );
};