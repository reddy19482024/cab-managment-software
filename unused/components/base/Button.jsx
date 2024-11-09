import React from 'react';
import { Button as AntButton } from 'antd';

export function Button({ variant = 'default', label, icon, ...props }) {
  const type = variant === 'primary' ? 'primary' : 'default';
  
  return (
    <AntButton type={type} icon={icon} {...props}>
      {label}
    </AntButton>
  );
}