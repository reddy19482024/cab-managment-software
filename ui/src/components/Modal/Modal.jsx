import React from 'react';
import { Modal, Spin, Button, Space } from 'antd';
import PropTypes from 'prop-types';
import * as AntdIcons from '@ant-design/icons';
import FormComponent from '../Form/Form';
import './ModalComponent.css';

const POSITION_STYLES = {
  right: {
    wrapper: {
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: 'fit-content',
      margin: 0,
      padding: 0,
    }
  },
  left: {
    wrapper: {
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: 'fit-content',
      margin: 0,
      padding: 0,
    }
  }
};

const getModalClassName = (position) => {
  if (position === 'right') return 'modal-right';
  if (position === 'left') return 'modal-left';
  return '';
};

const ModalComponent = ({
  config,
  visible,
  onClose,
  onSubmit,
  loading,
  form,
  record
}) => {
  if (!config) return null;

  const getIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  const handleSubmit = async (values) => {
    try {
      onSubmit(values);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const position = config.position || 'center';
  const baseStyles = POSITION_STYLES[position] || {};

  const modalProps = {
    title: config.title,
    open: visible,
    onCancel: onClose,
    width: config.width,
    maskClosable: false,
    destroyOnClose: true,
    className: getModalClassName(position),
    style: {
      ...baseStyles.wrapper,
      ...config.style
    }
  };

  if (config.type === 'confirm') {
    return (
      <Modal
        {...modalProps}
        footer={
          <Space>
            {config.actions?.map((action, index) => (
              <Button
                key={index}
                {...action.buttonProps}
                onClick={() => {
                  if (action.onClick?.type === 'close') {
                    onClose();
                  } else if (action.buttonProps?.htmlType === 'submit') {
                    handleSubmit();
                  }
                }}
                loading={action.buttonProps?.htmlType === 'submit' && loading}
                icon={action.buttonProps?.icon && getIcon(action.buttonProps?.icon)}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        }
      >
        <div>{config.content}</div>
      </Modal>
    );
  }

  const formConfig = {
    sections: [{
      type: 'form',
      layout: config.layout,
      fields: config.fields,
      actions: [] // We handle actions in modal footer
    }]
  };

  return (
    <Modal
      {...modalProps}
      footer={
        <Space>
          {config.actions?.map((action, index) => (
            <Button
              key={index}
              {...action.buttonProps}
              onClick={() => {
                if (action.onClick?.type === 'close') {
                  onClose();
                } else if (action.buttonProps?.htmlType === 'submit') {
                  form.submit();
                }
              }}
              loading={action.buttonProps?.htmlType === 'submit' && loading}
              icon={action.buttonProps?.icon && getIcon(action.buttonProps?.icon)}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      }
    >
      <Spin spinning={loading}>
        <FormComponent
          config={formConfig}
          form={form}
          loading={loading}
          onFormSubmit={handleSubmit}
          initialValues={record}
        />
      </Spin>
    </Modal>
  );
};

ModalComponent.propTypes = {
  config: PropTypes.shape({
    title: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['confirm', 'form']),
    position: PropTypes.oneOf(['center', 'right', 'left']),
    width: PropTypes.number,
    layout: PropTypes.shape({
      type: PropTypes.oneOf(['vertical', 'horizontal', 'inline'])
    }),
    fields: PropTypes.array,
    actions: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      buttonProps: PropTypes.object,
      onClick: PropTypes.object
    }))
  }),
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  form: PropTypes.object.isRequired,
  record: PropTypes.object
};

ModalComponent.defaultProps = {
  loading: false,
  record: {}
};

export default ModalComponent;