import React from 'react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
  };

  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${className}`}
    />
  );
};