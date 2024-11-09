import React, { Suspense } from 'react';
import { Spin } from 'antd';
import { useConfig } from '../hooks/useConfig';
import { useApi } from '../hooks/useApi';
import LayoutBuilder from './LayoutBuilder';
import ComponentBuilder from './ComponentBuilder';

const PageBuilder = ({ pageKey }) => {
  const { pages } = useConfig();
  const api = useApi();

  // Get page configuration
  const pageConfig = pages?.[pageKey];

  if (!pageConfig) {
    console.error(`Page configuration not found: ${pageKey}`);
    return <div>Page not found</div>;
  }

  // Build section with grid support
  const buildSection = (section) => {
    const {
      id,
      type = 'default',
      grid,
      components = [],
      style = {}
    } = section;

    // Handle grid layout
    if (grid) {
      return (
        <div
          key={id}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${grid.columns || 12}, 1fr)`,
            gap: grid.gap || '1rem',
            ...style
          }}
        >
          {components.map((componentConfig, index) => (
            <div
              key={`${id}-comp-${index}`}
              style={{
                gridColumn: `span ${componentConfig.span || 12}`
              }}
            >
              <ComponentBuilder
                config={componentConfig}
                pageConfig={pageConfig}
              />
            </div>
          ))}
        </div>
      );
    }

    // Handle regular section
    return (
      <div key={id} style={style}>
        {components.map((componentConfig, index) => (
          <ComponentBuilder
            key={`${id}-comp-${index}`}
            config={componentConfig}
            pageConfig={pageConfig}
          />
        ))}
      </div>
    );
  };

  // Handle page data fetching
  const PageContent = () => {
    const [pageData, setPageData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
      const fetchPageData = async () => {
        // Check if page has initial data config
        if (!pageConfig.api?.initial) return;

        setLoading(true);
        try {
          const response = await api.request(pageConfig.api.initial);
          setPageData(response);
        } catch (error) {
          console.error('Failed to fetch page data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPageData();
    }, [pageConfig.api?.initial]);

    if (loading) {
      return <Spin size="large" />;
    }

    return (
      <div style={pageConfig.style?.container}>
        {pageConfig.sections?.map((section) => buildSection(section))}
      </div>
    );
  };

  // Handle page breadcrumbs
  const Breadcrumb = () => {
    if (!pageConfig.breadcrumb) return null;

    return (
      <ComponentBuilder
        config={{
          type: 'antd.Breadcrumb',
          items: pageConfig.breadcrumb
        }}
      />
    );
  };

  // Build complete page with layout
  return (
    <LayoutBuilder type={pageConfig.layout}>
      <Suspense fallback={<Spin size="large" />}>
        <div style={pageConfig.style?.page}>
          {/* Page Header */}
          {pageConfig.header && (
            <ComponentBuilder
              config={pageConfig.header}
              pageConfig={pageConfig}
            />
          )}

          {/* Breadcrumb */}
          <Breadcrumb />

          {/* Main Content */}
          <PageContent />
        </div>
      </Suspense>
    </LayoutBuilder>
  );
};

export default PageBuilder;