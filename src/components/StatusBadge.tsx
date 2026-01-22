interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isActive = status.toLowerCase() === 'active';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-600'
    }`}>
      {status}
    </span>
  );
}
