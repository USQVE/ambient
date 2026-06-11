import React, { useState } from 'react';

interface EditableFormulaProps {
  initialFormula?: string;
  onSave?: (formula: string) => void;
  className?: string;
}

export const EditableFormula: React.FC<EditableFormulaProps> = ({
  initialFormula = 'E = mc^2',
  onSave,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialFormula);

  const handleSave = () => {
    setIsEditing(false);
    onSave?.(value);
  };

  return (
    <div
      className={`border-b border-dashed border-amber-600/40 p-2 cursor-pointer hover:bg-amber-100/30 transition-all ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-amber-50 border border-amber-400 rounded px-2 py-1 font-mono text-sm"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-amber-700 text-amber-50 rounded text-xs"
          >
            💾
          </button>
        </div>
      ) : (
        <div className="font-mono text-amber-900 text-lg tracking-wide">
          {value}
          <span className="ml-2 text-xs text-amber-500 opacity-60">✎</span>
        </div>
      )}
    </div>
  );
};
