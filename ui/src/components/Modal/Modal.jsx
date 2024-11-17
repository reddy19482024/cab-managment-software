import React from 'react';
import { Modal, Spin, Button, Space } from 'antd';
import PropTypes from 'prop-types';
import * as AntdIcons from '@ant-design/icons';
import FormComponent from '../Form/Form';

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

  if (config.type === 'confirm') {
    return (
      <Modal
        title={config.title}
        open={visible}
        onCancel={onClose}
        width={config.width}
        maskClosable={false}
        destroyOnClose
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

  // Create form config for FormComponent
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
      title={config.title}
      open={visible}
      onCancel={onClose}
      width={config.width}
      maskClosable={false}
      destroyOnClose
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