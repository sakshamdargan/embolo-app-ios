import { ReactNode, useEffect, useState } from 'react';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [headerHeight, setHeaderHeight] = useState(72);
  const [footerHeight, setFooterHeight] = useState(64);

  useEffect(() => {
    const measure = () => {
      const headerEl = document.getElementById('app-header');
      const footerEl = document.getElementById('app-footer');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
      if (footerEl) setFooterHeight(footerEl.getBoundingClientRect().height);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Fixed top spacing to avoid header overlap and dynamic bottom to clear footer
  const topPadding = '7.5rem';
  const bottomPadding = `${Math.max(0, Math.round(footerHeight))}px`;

  return (
    <div style={{ paddingTop: topPadding, paddingBottom: bottomPadding }}>
      {children}
    </div>
  );
};

export default Layout;


