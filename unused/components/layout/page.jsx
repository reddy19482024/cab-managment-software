// frontend/src/components/layout/Page.jsx
import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import LayoutBuilder from '@/builders/LayoutBuilder';

const Page = ({ pageConfig, children }) => {
  const { config } = useConfig();
  const layoutType = pageConfig?.layout || 'default';

  return (
    <LayoutBuilder type={layoutType}>
      {children}
    </LayoutBuilder>
  );
};

export default Page;