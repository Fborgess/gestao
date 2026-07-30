import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function SortableHeader({ label, sortKey, currentSort, onSort, align = 'left' }) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    if (isActive) {
      onSort(sortKey, direction === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(sortKey, 'asc');
    }
  };

  const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : '';

  return (
    <th onClick={handleClick} className="p-3 cursor-pointer select-none hover:bg-gray-100 transition-colors">
      <div className={`flex items-center gap-1 ${alignClass}`}>
        <span>{label}</span>
        <span className="text-gray-400">
          {!isActive && <ChevronsUpDown size={14} />}
          {isActive && direction === 'asc' && <ChevronUp size={14} className="text-blue-600" />}
          {isActive && direction === 'desc' && <ChevronDown size={14} className="text-blue-600" />}
        </span>
      </div>
    </th>
  );
}
