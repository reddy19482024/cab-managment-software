// src/components/Footer/FooterComponent.jsx
import React from 'react';
import { Layout } from 'antd';
import PropTypes from 'prop-types';

const { Footer } = Layout;

const FooterComponent = ({ config }) => {
  // Directly use the config prop instead of config.layout.footer
  if (!config?.enabled) return null;

  return (
    <Footer 
      style={{
        ...(config.style || {}),
        position: 'relative',
        width: '100%',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {config.text}
        {config.links && (
          <div 
            style={{ 
              marginTop: 8,
              display: 'flex',
              gap: '16px',
              justifyContent: 'center'
            }}
          >
            {config.links.map((link, index) => (
              <a 
                key={index}
                href={link.url}
                style={{
                  color: config.style?.linkColor || 'inherit',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                target={link.external ? "_blank" : "_self"}
                rel={link.external ? "noopener noreferrer" : undefined}
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
    enabled: PropTypes.bool,
    style: PropTypes.object,
    text: PropTypes.string,
    links: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string,
      url: PropTypes.string,
      external: PropTypes.bool
    }))
  }).isRequired
};

export default FooterComponent;