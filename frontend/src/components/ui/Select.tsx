import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {}
});

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <svg
        className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}
    >
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ children, value, className = '' }) => {
  const { onValueChange, setIsOpen } = React.useContext(SelectContext);

  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen(false);
  };

  return (
    <div
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className = '' }) => {
  const { value } = React.useContext(SelectContext);

  return (
    <span className={`block truncate ${!value ? 'text-gray-500' : ''} ${className}`}>
      {value || placeholder}
    </span>
  );
};