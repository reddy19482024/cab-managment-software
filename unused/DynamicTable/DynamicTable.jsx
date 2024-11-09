import React, { useEffect, useState } from 'react';
import { Table, Button, Space } from 'antd';

const DynamicTable = ({ config, fetchData }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchData().then((records) => {
      setData(records);
      setLoading(false);
    });
  }, [fetchData]);

  const columns = [
    ...config.list.columns.map((col) => ({
      title: col.label,
      dataIndex: col.field,
      key: col.field,
    })),
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button>Edit</Button>
          <Button danger>Delete</Button>
        </Space>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} loading={loading} rowKey="_id" />;
};

export default DynamicTable;
