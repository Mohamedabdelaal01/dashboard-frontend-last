import { UserCircle } from 'lucide-react';
import { SALES_REPS } from '../utils/assignments';

const RepSelector = ({ currentRep, onChange, compact = false }) => {
  return (
    <div
      className={`flex items-center gap-2 ${
        compact ? '' : 'bg-dark-800/40 border border-dark-700 rounded-xl px-3 py-2'
      }`}
    >
      {!compact && <UserCircle className="w-4 h-4 text-primary-400" />}
      {!compact && (
        <span className="text-dark-400 text-[11px] font-bold hidden sm:inline">
          المندوب:
        </span>
      )}
      <select
        value={currentRep}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-white text-xs font-black outline-none cursor-pointer"
      >
        {SALES_REPS.map((r) => (
          <option key={r} value={r} className="bg-dark-900">
            {r}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RepSelector;
