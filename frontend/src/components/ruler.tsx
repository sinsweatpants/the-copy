import React from 'react';

interface Props {
  visible: boolean;
}

const Ruler: React.FC<Props> = ({ visible }) => {
  if (!visible) return null;
  const marks = Array.from({ length: 20 }, (_, i) => i + 1);
  return (
    <div className="flex text-xs text-gray-400 select-none mb-1">
      {marks.map(n => (
        <span key={n} className="w-8 text-center border-r">
          {n}
        </span>
      ))}
    </div>
  );
};

export default Ruler;
