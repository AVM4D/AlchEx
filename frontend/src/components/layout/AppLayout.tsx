import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../ui/CommandPalette';

const AppLayout: React.FC = () => {
  return (
    <div className="hypr-bg">
      {/* Atmospheric background — purple fill for gaps */}
      <div className="hypr-atmosphere" />

      {/* Noise overlay */}
      <div className="noise" />

      {/* Command Palette (⌘K) */}
      <CommandPalette />

      {/* Dock (left on desktop, bottom on mobile) */}
      <Sidebar />

      {/* Main content "window" */}
      <div className="hypr-content-wrapper">
        <motion.main
          className="hypr-window"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Window background effects */}
          <div className="grid-lines" style={{ zIndex: 0, position: 'absolute', borderRadius: 'inherit' }} />
          <div className="orb orb-purple w-[500px] h-[500px] top-[20%] left-[10%]" style={{ zIndex: 0 }} />
          <div className="orb orb-blue w-[400px] h-[400px] bottom-[15%] right-[10%]" style={{ zIndex: 0, animationDelay: '-8s' }} />

          <div className="hypr-window-inner">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default AppLayout;
