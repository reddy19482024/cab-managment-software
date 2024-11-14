// BannerComponent.jsx
import React from 'react';
import PropTypes from 'prop-types';

const BannerComponent = ({ config }) => {
  const bannerSection = config.sections?.find(section => section.type === 'banner');

  if (!bannerSection) return null;

  return (
    <div style={{ ...(bannerSection.style || {}) }}>
      <div style={{ ...(bannerSection.content?.style || {}) }}>
        {bannerSection.content?.image && (
          <img 
            src={bannerSection.content.image} 
            alt="Banner" 
            style={{ height: '32px', marginBottom: '12px' }}
          />
        )}
        {bannerSection.content?.title && (
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
            {bannerSection.content.title}
          </h1>
        )}
        {bannerSection.content?.description && (
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0 0' }}>
            {bannerSection.content.description}
          </p>
        )}
      </div>
    </div>
  );
};

BannerComponent.propTypes = {
  config: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      style: PropTypes.object,
      content: PropTypes.shape({
        style: PropTypes.object,
        image: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string
      })
    }))
  }).isRequired
};

export default BannerComponent;