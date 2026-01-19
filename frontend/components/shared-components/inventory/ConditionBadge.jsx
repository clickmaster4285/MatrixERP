import { cn } from '@/lib/utils';


const conditionConfig = {
  excellent: { label: 'Excellent', class: 'condition-excellent' },
  good: { label: 'Good', class: 'condition-good' },
  fair: { label: 'Fair', class: 'condition-fair' },
  poor: { label: 'Poor', class: 'condition-poor' },
  scrap: { label: 'Scrap', class: 'condition-scrap' },
};

export function ConditionBadge({
  condition,
  count,
  showLabel = true,
  size = 'md',
}) {
  const config = conditionConfig[condition];

  return (
    <span
      className={cn(
        'inventory-badge',
        config.class,
        size === 'sm' && 'text-[10px] px-1.5 py-0.5'
      )}
    >
      {showLabel ? config.label : ''}
      {count !== undefined && (
        <span className={cn(showLabel && 'ml-1')}>
          {showLabel ? `(${count})` : count}
        </span>
      )}
    </span>
  );
}
