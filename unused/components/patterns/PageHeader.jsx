// frontend/src/components/patterns/PageHeader.jsx
import React from 'react';
import { Typography, Space } from 'antd';
import { Button } from '../base/Button';

export function PageHeader({ config }) {
  const { title, subtitle, actions } = config;

  return (
    <div className="flex justify-between items-center mb-6 p-4">
      <div>
        <Typography.Title level={2} className="!mb-0">
          {title}
        </Typography.Title>
        {subtitle && (
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        )}
      </div>
      {actions && (
        <Space>
          {actions.items?.map((action, index) => (
            <Button key={index} {...action} />
          ))}
        </Space>
      )}
    </div>
  );
}