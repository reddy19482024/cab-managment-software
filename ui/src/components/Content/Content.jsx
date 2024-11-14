// ContentLayout.jsx
import React from 'react';
import { Layout } from 'antd';
import PropTypes from 'prop-types';
import TableComponent from '../Table/Table';
import FormComponent from '../Form/Form';
import BannerComponent from '../Banner/Banner';

const { Content } = Layout;

const ContentLayout = ({
  config,
  loading,
  tableData,
  form,
  onModalOpen,
  onFormSubmit,
  onSearch,
  onFilter
}) => {
  const contentConfig = config.layout?.content;
  const formSection = config.sections?.find(section => section.type === 'form');

  return (
    <Content 
      style={{
        ...(contentConfig?.style || {}),
        minHeight: 'calc(100vh - 64px)',
        background: '#f0f2f5'
      }}
    >
      <BannerComponent config={config} />
      
      {formSection?.table?.enabled ? (
        <TableComponent
          config={config}
          loading={loading}
          tableData={tableData}
          onModalOpen={onModalOpen}
          onSearch={onSearch}
          onFilter={onFilter}
        />
      ) : (
        <FormComponent
          config={config}
          form={form}
          loading={loading}
          onModalOpen={onModalOpen}
          onFormSubmit={onFormSubmit}
        />
      )}
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
    sections: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  tableData: PropTypes.array.isRequired,
  form: PropTypes.object.isRequired,
  onModalOpen: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func
};

export default ContentLayout;