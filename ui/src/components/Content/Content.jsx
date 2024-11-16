// src/components/Content/ContentLayout.jsx
import React from 'react';
import { Layout, Card, Row, Col, Statistic, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import TableComponent from '../Table/Table';
import * as AntdIcons from '@ant-design/icons';

const { Content } = Layout;

const ContentLayout = ({
  config,
  loading,
  tableData,
  form,
  onModalOpen,
  onSearch,
  onFilter,
  onDelete,
  onTableChange,
  pagination
}) => {
  // Helper function to get icon component
  const getIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  // Render breadcrumb based on config
  const renderBreadcrumb = () => {
    if (!config.breadcrumb?.items) return null;

    return (
      <Breadcrumb 
        style={{ marginBottom: '16px' }}
        items={config.breadcrumb.items.map(item => ({
          title: item.link ? (
            <Link to={item.link}>{item.label}</Link>
          ) : item.label,
          ...(item.icon && { icon: getIcon(item.icon) })
        }))}
      />
    );
  };

  // Render statistics cards
  const renderStatistics = (section) => {
    if (!section.items || !Array.isArray(section.items)) return null;

    return (
      <Row gutter={[16, 16]}>
        {section.items.map((stat, index) => (
          <Col 
            key={index}
            xs={24}
            sm={12}
            md={6}
            lg={6}
          >
            <Card
              hoverable
              style={{
                height: '100%',
                borderRadius: '8px',
                ...section.itemStyle
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={stat.precision}
                prefix={stat.icon && getIcon(stat.icon)}
                suffix={stat.suffix}
                valueStyle={{
                  color: stat.valueColor || '#1890ff',
                  ...stat.valueStyle
                }}
              />
              {stat.description && (
                <div style={{ 
                  marginTop: '8px',
                  color: 'rgba(0, 0, 0, 0.45)',
                  fontSize: '14px'
                }}>
                  {stat.description}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Render banner section
  const renderBanner = (section) => {
    if (!section.content) return null;

    return (
      <div
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '24px',
          ...section.style
        }}
      >
        <div style={{ 
          padding: '24px',
          ...section.content.style
        }}>
          {section.content.title && (
            <h1 style={{ 
              color: section.content.style?.color || '#fff',
              margin: 0,
              fontSize: '24px',
              fontWeight: 500
            }}>
              {section.content.title}
            </h1>
          )}
          {section.content.description && (
            <p style={{ 
              color: section.content.style?.color || '#fff',
              margin: '8px 0 0',
              opacity: 0.85
            }}>
              {section.content.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render form section with table
  const renderFormSection = (section) => {
    if (!section.table?.enabled) return null;

    return (
      <div style={section.containerStyle}>
        <div style={{
          borderRadius: '8px',
          ...section.wrapperStyle
        }}>
          <TableComponent
            section={section}
            loading={loading}
            data={tableData}
            onModalOpen={onModalOpen}
            onSearch={onSearch}
            onFilter={onFilter}
            onDelete={onDelete}
            onTableChange={onTableChange}
            pagination={pagination}
          />
        </div>
      </div>
    );
  };

  // Render custom section
  const renderCustomSection = (section) => {
    if (!section.render) return null;

    return (
      <div style={section.style}>
        {section.render(config, {
          loading,
          tableData,
          form,
          onModalOpen,
          onSearch,
          onFilter,
          onDelete
        })}
      </div>
    );
  };

  // Render section based on type
  const renderSection = (section, index) => {
    switch (section.type) {
      case 'banner':
        return (
          <div key={index} style={{ marginBottom: '24px' }}>
            {renderBanner(section)}
          </div>
        );
      case 'statistics':
        return (
          <div key={index} style={{ marginBottom: '24px' }}>
            {renderStatistics(section)}
          </div>
        );
      case 'form':
        return (
          <div key={index}>
            {renderFormSection(section)}
          </div>
        );
      case 'custom':
        return (
          <div key={index} style={{ marginBottom: '24px' }}>
            {renderCustomSection(section)}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Content
      style={{
        padding: '24px',
        minHeight: 280,
        ...config.layout.content.style
      }}
    >
      {renderBreadcrumb()}
      
      {config.sections?.map((section, index) => (
        renderSection(section, index)
      ))}
    </Content>
  );
};

ContentLayout.propTypes = {
  config: PropTypes.shape({
    layout: PropTypes.shape({
      content: PropTypes.shape({
        style: PropTypes.object
      })
    }),
    breadcrumb: PropTypes.shape({
      items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        link: PropTypes.string,
        icon: PropTypes.string
      }))
    }),
    sections: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.oneOf(['banner', 'statistics', 'form', 'custom']).isRequired,
      style: PropTypes.object,
      containerStyle: PropTypes.object,
      wrapperStyle: PropTypes.object,
      content: PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        style: PropTypes.object
      }),
      items: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        value: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]),
        precision: PropTypes.number,
        suffix: PropTypes.string,
        prefix: PropTypes.string,
        icon: PropTypes.string,
        valueColor: PropTypes.string,
        valueStyle: PropTypes.object,
        description: PropTypes.string
      })),
      table: PropTypes.shape({
        enabled: PropTypes.bool
      }),
      render: PropTypes.func
    }))
  }).isRequired,
  loading: PropTypes.bool,
  tableData: PropTypes.array,
  form: PropTypes.object,
  onModalOpen: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func,
  onDelete: PropTypes.func,
  onTableChange: PropTypes.func,
  pagination: PropTypes.shape({
    current: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number,
    showSizeChanger: PropTypes.bool,
    showQuickJumper: PropTypes.bool
  })
};

ContentLayout.defaultProps = {
  loading: false,
  tableData: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true
  }
};

export default ContentLayout;