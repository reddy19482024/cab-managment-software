import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { Link } from 'react-router-dom';

function Breadcrumb({ items = [] }) {
  return (
    <AntBreadcrumb>
      {items.map((item, index) => (
        <AntBreadcrumb.Item key={index}>
          {item.path ? (
            <Link to={item.path}>{item.label}</Link>
          ) : (
            item.label
          )}
        </AntBreadcrumb.Item>
      ))}
    </AntBreadcrumb>
  );
}

export default Breadcrumb;