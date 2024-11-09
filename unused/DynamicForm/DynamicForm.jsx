import React, { useState } from 'react';
import { Input, Button, Select } from 'antd';

const DynamicForm = ({ config, onSubmit }) => {
  const [formData, setFormData] = useState({});

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow-md rounded-lg">
      {config.fields.map((field) => (
        <div key={field.name} className="mb-4">
          {field.type === 'select' ? (
            <Select
              placeholder={field.placeholder}
              options={field.options.map((opt) => ({ value: opt, label: opt }))}
              onChange={(value) => handleChange(field.name, value)}
            />
          ) : (
            <Input
              type={field.type}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          )}
        </div>
      ))}
      <Button type="primary" htmlType="submit" className="w-full">
        {config.submitButton.text}
      </Button>
    </form>
  );
};

export default DynamicForm;
