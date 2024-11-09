// src/components/base/Table/index.jsx
import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { useApi } from '../../../hooks/useApi';

const BaseTable = ({ config }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const api = useApi();

  const loadData = async (params = {}) => {
    if (!config.api) return;

    setLoading(true);
    try {
      const response = await api.get(config.api.url, {
        ...params,
        page: params.current,
        pageSize: params.pageSize
      });
      
      setData(response.data);
      setPagination({
        ...pagination,
        total: response.total
      });
    } catch (error) {
      console.error('Failed to load table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    loadData({
      ...newPagination,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters
    });
  };

  useEffect(() => {
    loadData({
      current: pagination.current,
      pageSize: pagination.pageSize
    });
  }, [config.api?.url]);

  return (
    <Table
      {...config.props}
      columns={config.columns}
      dataSource={data}
      pagination={pagination}
      loading={loading}
      onChange={handleTableChange}
      rowKey={config.rowKey || 'id'}
    />
  );
};

export default BaseTable;