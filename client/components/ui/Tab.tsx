import React, { ReactNode } from 'react';

interface TabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}

export function Tab({ active, onClick, label, icon }: TabProps) {
  return (
    <button
      className={`flex-1 py-3 px-4 flex items-center justify-center text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-green-500 text-green-600 bg-white'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}