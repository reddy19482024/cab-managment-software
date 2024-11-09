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
          />
        );
      default:
        return (
          <Input
            size={field.size}
            placeholder={field.placeholder}
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
    >
      <Form
        form={form}
        layout={modalConfig.layout.type}
        onFinish={onSubmit}
      >
        {modalConfig.fields.map((field) => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={field.label}
            rules={field.rules}
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