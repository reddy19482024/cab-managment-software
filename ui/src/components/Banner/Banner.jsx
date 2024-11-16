// BannerComponent.jsx
import React from 'react';
import PropTypes from 'prop-types';

const BannerComponent = ({ section }) => {
  if (!section) return null;

  return (
    <div style={{
      ...section.style,
      marginBottom: '24px'
    }}>
      <div style={section.content?.style}>
        <h1 style={{ 
          color: '#ffffff',
          margin: 0,
          fontSize: '24px',
          fontWeight: '600'
        }}>
          {section.content?.title}
        </h1>
        {section.content?.description && (
          <p style={{ 
            color: '#ffffff',
            margin: '8px 0 0',
            opacity: 0.8 
          }}>
            {section.content.description}
          </p>
        )}
      </div>
    </div>
  );
};

BannerComponent.propTypes = {
  section: PropTypes.shape({
    style: PropTypes.object,
    content: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      style: PropTypes.object
    })
  })
};

export default BannerComponent;