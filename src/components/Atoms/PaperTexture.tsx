import React from 'react';
import { InkBlot } from './InkBlot';
import { Vignette } from './Vignette';

export const PaperTexture: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <InkBlot count={7} />
      <Vignette />
      <div className="relative z-10">{children}</div>
    </>
  );
};
