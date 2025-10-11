import { ReactNode, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [headerHeight, setHeaderHeight] = useState(120);
  const [footerHeight, setFooterHeight] = useState(64);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const measure = () => {
      const headerEl = document.getElementById('app-header');
      const footerEl = document.getElementById('app-footer');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
      if (footerEl) setFooterHeight(footerEl.getBoundingClientRect().height);
    };

    // Delay measurement to ensure elements are rendered
    setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Calculate padding based on actual header/footer heights
  const topPadding = `${headerHeight}px`;
  const bottomPadding = `${footerHeight + 16}px`;

  return (
    <div 
      className="layout-content"
      style={{ 
        paddingTop: topPadding, 
        paddingBottom: bottomPadding,
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  );
};

export default Layout;


