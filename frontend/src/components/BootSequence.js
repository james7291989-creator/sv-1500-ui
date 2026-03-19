import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BootSequence = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Secure Protocol...');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const statusMessages = [
      { at: 0, text: 'Initializing Secure Protocol...' },
      { at: 20, text: 'Establishing Data Link...' },
      { at: 40, text: 'Loading Property Matrix...' },
      { at: 60, text: 'Syncing Investment Vault...' },
      { at: 80, text: 'Calibrating AI Engine...' },
      { at: 95, text: 'System Online' }
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        const status = statusMessages.find(s => s.at <= newProgress && newProgress < (statusMessages.find((_, i, arr) => arr[i]?.at > newProgress)?.at || 101));
        if (status) setStatusText(status.text);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500);
          }, 400);
          return 100;
        }
        return newProgress;
      });
    }, 28);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(20px)' }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: '#010101' }}
        >
          {/* Background Radial Reactor */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: [0.23, 1, 0.32, 1]
              }}
              style={{
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(191,149,63,0.15) 0%, rgba(191,149,63,0.05) 40%, transparent 70%)',
                borderRadius: '50%'
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{
                width: '400px',
                height: '400px',
                border: '1px solid rgba(191,149,63,0.1)',
                borderRadius: '50%'
              }}
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center">
            {/* Logo/Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="mb-12"
            >
              <h1 
                className="font-display text-2xl md:text-3xl tracking-[0.3em] mb-2"
                style={{ 
                  color: '#bf953f',
                  textShadow: '0 0 30px rgba(191,149,63,0.4)'
                }}
              >
                SV-1500
              </h1>
              <p 
                className="font-display text-xs tracking-[0.5em]"
                style={{ color: 'rgba(191,149,63,0.6)' }}
              >
                GRANDMASTER EDITION
              </p>
            </motion.div>

            {/* Progress Bar Container */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative w-80 md:w-96 mx-auto"
            >
              {/* Progress Track */}
              <div 
                className="h-[2px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #8b6914 0%, #bf953f 50%, #fcf6ba 100%)',
                    boxShadow: '0 0 20px rgba(191,149,63,0.5)'
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Progress Percentage */}
              <div className="flex justify-between mt-4">
                <motion.span 
                  className="font-mono-data text-xs"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {statusText}
                </motion.span>
                <span 
                  className="font-mono-data text-xs"
                  style={{ color: '#bf953f' }}
                >
                  {progress}%
                </span>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-16 flex items-center justify-center gap-8"
            >
              <div className="w-16 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(191,149,63,0.3))' }} />
              <div 
                className="w-2 h-2 rounded-full animate-pulse-gold"
                style={{ background: '#bf953f', boxShadow: '0 0 10px rgba(191,149,63,0.5)' }}
              />
              <div className="w-16 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(191,149,63,0.3), transparent)' }} />
            </motion.div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-8 left-8 w-12 h-12 border-l border-t" style={{ borderColor: 'rgba(191,149,63,0.2)' }} />
          <div className="absolute top-8 right-8 w-12 h-12 border-r border-t" style={{ borderColor: 'rgba(191,149,63,0.2)' }} />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-l border-b" style={{ borderColor: 'rgba(191,149,63,0.2)' }} />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-r border-b" style={{ borderColor: 'rgba(191,149,63,0.2)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BootSequence;
