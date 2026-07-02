import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300 hover:bg-white/5"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon - visible in dark mode, rotates in */}
      <Sun
        className={`absolute transition-all duration-500 ${
          theme === 'dark'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 rotate-90 scale-75'
        }`}
        style={{ color: '#00f0ff', width: '18px', height: '18px' }}
      />
      {/* Moon icon - visible in light mode, rotates in */}
      <Moon
        className={`absolute transition-all duration-500 ${
          theme === 'light'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-75'
        }`}
        style={{ color: '#ab22ff', width: '18px', height: '18px' }}
      />
    </button>
  );
}
