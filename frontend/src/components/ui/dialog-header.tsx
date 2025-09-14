import React from 'react';

const DialogHeader: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="text-lg font-bold mb-2">{children}</div>
);

export default DialogHeader;
