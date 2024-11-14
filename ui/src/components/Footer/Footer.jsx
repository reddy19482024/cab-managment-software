// FooterComponent.jsx
import React from 'react';
import { Layout } from 'antd';
import PropTypes from 'prop-types';

const { Footer } = Layout;

const FooterComponent = ({ config }) => {
  const footerConfig = config.layout?.footer;

  if (!footerConfig?.enabled) return null;

  return (
    <Footer 
      style={{
        ...(footerConfig.style || {}),
        width: '100%'
      }}
    >
      <div>
        {footerConfig.text}
        {footerConfig.links && (
          <div style={{ marginTop: 8 }}>
            {footerConfig.links.map((link, index) => (
              <a 
                key={index}
                href={link.url}
                style={{
                  marginLeft: index > 0 ? 16 : 0,
                  color: footerConfig.style?.color || 'inherit'
                }}
              >
                {link.text}
              </a>
            ))}
          </div>
        )}
      </div>
    </Footer>
  );
};

FooterComponent.propTypes = {
  config: PropTypes.shape({
    layout: PropTypes.shape({
      footer: PropTypes.shape({
        enabled: PropTypes.bool,
        style: PropTypes.object,
        text: PropTypes.string,
        links: PropTypes.arrayOf(PropTypes.shape({
          text: PropTypes.string,
          url: PropTypes.string
        }))
      })
    })
  }).isRequired
};

export default FooterComponent;
