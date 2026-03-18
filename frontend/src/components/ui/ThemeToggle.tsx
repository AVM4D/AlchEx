import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('alchex-theme') as 'dark' | 'light') || 'dark';
        }
        return 'dark';
    });

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('alchex-theme', theme);
    }, [theme]);

    const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

    return (
        <button
            onClick={toggle}
            className="glass p-2.5 rounded-xl text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-hover)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
        </button>
    );
};
