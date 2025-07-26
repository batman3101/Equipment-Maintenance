import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import { Button } from './Button';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: '라이트 모드',
      icon: <Sun className="h-4 w-4" />
    },
    {
      value: 'dark',
      label: '다크 모드',
      icon: <Moon className="h-4 w-4" />
    },
    {
      value: 'system',
      label: '시스템 모드',
      icon: <Monitor className="h-4 w-4" />
    }
  ];

  const currentTheme = themes.find(t => t.value === theme);

  if (variant === 'icon') {
    const handleToggle = () => {
      const nextTheme: ThemeMode = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
      setTheme(nextTheme);
    };

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className={`h-9 w-9 ${className}`}
        title={`현재: ${currentTheme?.label} (클릭하여 변경)`}
      >
        {currentTheme?.icon}
      </Button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeMode)}
        className="appearance-none bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
      >
        {themes.map((themeOption) => (
          <option key={themeOption.value} value={themeOption.value}>
            {themeOption.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        {currentTheme?.icon}
      </div>
    </div>
  );
}