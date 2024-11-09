// frontend/src/components/layout/PageContainer.jsx
import React from 'react';
import Breadcrumb from './Breadcrumb';

function PageContainer({ title, subtitle, breadcrumb = [], children }) {
  return (
    <div>
      <div className="mb-6">
        {breadcrumb.length > 0 && (
          <Breadcrumb items={breadcrumb} className="mb-4" />
        )}
        {title && <h1 className="text-2xl font-semibold mb-1">{title}</h1>}
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default PageContainer;