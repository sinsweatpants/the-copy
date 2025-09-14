import React from 'react';

const DropdownMenuShortcut: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="ml-auto pl-4 text-xs text-muted-foreground">{children}</span>
);

export default DropdownMenuShortcut;
