import React from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { renderLayout } from '../utils/Renderer';

const DynamicPage = ({ pageId }) => {
  const config = useConfig();
  const pageConfig = config?.pages[pageId];

  if (!pageConfig) return <div>Page not found</div>;

  return (
    <div className={pageConfig.styles.container}>
      <div className={pageConfig.styles.content}>
        {renderLayout(pageConfig.layout, pageConfig)}
      </div>
    </div>
  );
};

export default DynamicPage;
