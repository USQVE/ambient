import React from 'react';

export const Vignette: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3), inset 0 0 30px rgba(0,0,0,0.2)',
      }}
    />
  );
};
