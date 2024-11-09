import React from 'react';
import { Menu } from 'antd';

const Sidebar = ({ items }) => (
  <aside>
    <Menu mode="vertical">
      {items.map((item) => (
        <Menu.Item key={item.path}>
          <a href={item.path}>{item.label}</a>
        </Menu.Item>
      ))}
    </Menu>
  </aside>
);

export default Sidebar;
