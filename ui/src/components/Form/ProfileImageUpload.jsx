import React, { useState } from 'react';
import { Upload, message, Modal } from 'antd';
import { LoadingOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import useApi from '../../hooks/useApi';

const ProfileImageUpload = ({ 
  value, 
  onChange, 
  size = 100, 
  disabled = false,
  maxSize = 2,
  shape = 'circle',
  showEditOverlay = true,
  uploadProps = {}
}) => {
  const { apiRequest } = useApi();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(value);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const baseUrl = import.meta.env.VITE_API_URL;

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`Image must be smaller than ${maxSize}MB!`);
      return false;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    
    return true;
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append(uploadProps.name || 'image', file);
      
      // Add any additional form data from uploadProps
      if (uploadProps.data) {
        Object.entries(uploadProps.data).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await fetch(`${baseUrl}${uploadProps.action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          ...uploadProps.headers
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      onSuccess(data, file);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      const response = info.file.response;
      if (response?.data) {
        const { transform } = uploadProps;
        let transformedValue = {};

        if (transform) {
          // Transform response according to configuration
          Object.entries(transform).forEach(([key, path]) => {
            const value = path.split('.').reduce((obj, key) => obj?.[key], response.data);
            transformedValue[key] = value;
          });
        } else {
          transformedValue = {
            url: response.data.original_url,
            thumbnail: response.data.thumbnail_urls?.medium,
            id: response.data._id
          };
        }

        const displayUrl = transformedValue.thumbnail || transformedValue.url;
        setImageUrl(displayUrl);
        setLoading(false);
        onChange?.(transformedValue);
      }
    }

    if (info.file.status === 'error') {
      setLoading(false);
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setImageUrl('');
    onChange?.(null);
  };

  // Rest of the component rendering remains the same but update image URL handling
  const imageComponent = imageUrl && (
    <div
      style={{ 
        width: size,
        height: size,
        position: 'relative',
        borderRadius: shape === 'circle' ? '50%' : size / 10,
        overflow: 'hidden'
      }}
      onClick={handlePreview}
    >
      <img 
        src={imageUrl.startsWith('http') ? imageUrl : `${baseUrl}/${imageUrl}`} 
        alt="avatar" 
        style={{ 
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }} 
      />
      {showEditOverlay && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0,
            transition: 'opacity 0.3s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <EditOutlined style={{ color: '#fff', fontSize: 20 }} />
          <DeleteOutlined 
            style={{ color: '#fff', fontSize: 20, marginLeft: 8 }}
            onClick={handleRemove}
          />
        </div>
      )}
    </div>
  );

  const uploadButton = (
    <div
      style={{ 
        width: size, 
        height: size,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: shape === 'circle' ? '50%' : size / 10,
        border: '1px dashed #d9d9d9',
        backgroundColor: '#fafafa',
        transition: 'border-color 0.3s'
      }}
    >
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>Upload</div>
    </div>
  );

  return (
    <div style={{ display: 'inline-block' }}>
      <Upload
        name={uploadProps.name || 'image'}
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        customRequest={customRequest}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        disabled={disabled}
        accept={uploadProps.accept || '.jpg,.jpeg,.png'}
      >
        {imageUrl ? imageComponent : uploadButton}
      </Upload>
      
      <Modal
        open={previewVisible}
        title="Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img
          alt="Preview"
          style={{ width: '100%' }}
          src={previewImage || (imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}/${imageUrl}`) : '')}
        />
      </Modal>
    </div>
  );
};

ProfileImageUpload.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  size: PropTypes.number,
  disabled: PropTypes.bool,
  maxSize: PropTypes.number,
  shape: PropTypes.oneOf(['circle', 'square']),
  showEditOverlay: PropTypes.bool,
  uploadProps: PropTypes.shape({
    action: PropTypes.string.isRequired,
    name: PropTypes.string,
    data: PropTypes.object,
    headers: PropTypes.object,
    accept: PropTypes.string,
    transform: PropTypes.object
  })
};

export default ProfileImageUpload;