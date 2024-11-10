// components/Modal/index.js
import React from 'react';
import { Modal, Form, Button, Input, Select } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  LockOutlined
} from '@ant-design/icons';

const ModalComponent = ({
  modalConfig,
  visible,
  onClose,
  onSubmit,
  loading,
  form,
  currentModal,
  onDelete
}) => {
  const getIcon = (iconName) => {
    const icons = {
      PlusOutlined: <PlusOutlined />,
      EditOutlined: <EditOutlined />,
      DeleteOutlined: <DeleteOutlined />,
      MailOutlined: <MailOutlined />,
      LockOutlined: <LockOutlined />
    };
    return icons[iconName] || null;
  };

  const renderFormField = (field) => {
    switch (field.type) {
      case 'password':
        return (
          <Input.Password
            prefix={<LockOutlined />}
            size={field.size}
            placeholder={field.placeholder}
          />
        );
      case 'email':
        return (
          <Input
            prefix={<MailOutlined />}
            size={field.size}
            placeholder={field.placeholder}
          />
        );
      case 'select':
        return (
          <Select
            size={field.size}
            placeholder={field.placeholder}
            options={field.options}
            showSearch={field.showSearch}
            allowClear={field.allowClear}
          />
        );
      default:
        return (
          <Input
            size={field.size}
            placeholder={field.placeholder}
            type={field.type}
          />
        );
    }
  };

  if (!modalConfig) return null;

  if (modalConfig.type === 'confirm') {
    return (
      <Modal
        title={modalConfig.title}
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="cancel" onClick={onClose}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={loading}
            onClick={onDelete}
            icon={<DeleteOutlined />}
          >
            Delete
          </Button>
        ]}
      >
        <p>{modalConfig.content}</p>
      </Modal>
    );
  }

  return (
    <Modal
      title={modalConfig.title}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={modalConfig.width}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout={modalConfig.layout?.type || 'vertical'}
        labelCol={modalConfig.layout?.labelCol}
        wrapperCol={modalConfig.layout?.wrapperCol}
        onFinish={onSubmit}
      >
        {modalConfig.fields?.map((field) => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={field.label}
            rules={field.rules}
            tooltip={field.tooltip}
          >
            {renderFormField(field)}
          </Form.Item>
        ))}
        <Form.Item>
          <Button
            {...modalConfig.actions[0].buttonProps}
            loading={loading}
            onClick={() => form.submit()}
            icon={currentModal === 'addEmployeeModal' ? <PlusOutlined /> : <EditOutlined />}
            block
          >
            {modalConfig.actions[0].label}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalComponent;