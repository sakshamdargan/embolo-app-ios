import { useEffect, useState } from 'react';

interface AppLoaderProps {
  onLoadComplete: () => void;
}

const AppLoader = ({ onLoadComplete }: AppLoaderProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Show loader for minimum 2 seconds
    const timer = setTimeout(() => {
      setShow(false);
      // Small delay for fade out animation
      setTimeout(onLoadComplete, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  if (!show) {
    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-[#00aa63] to-[#009955] flex items-center justify-center z-[9999] transition-opacity duration-300 opacity-0"
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-[#00aa63] to-[#009955] flex flex-col items-center justify-center z-[9999] transition-opacity duration-300"
      style={{
        margin: 0,
        padding: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Main text centered */}
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-white text-7xl md:text-8xl font-bold tracking-tight lowercase">
          embolo
        </h1>
      </div>
      
      {/* Tagline at bottom */}
      <div className="pb-12 mb-0">
        <p className="text-white/90 text-base md:text-lg font-medium tracking-wide text-center">
          Your Meds, Our Priority
        </p>
      </div>
    </div>
  );
};

export default AppLoader;
