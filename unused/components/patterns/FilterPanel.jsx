// frontend/src/components/patterns/FilterPanel.jsx
import React from 'react';
import { Card, Form, Row, Col } from 'antd';
import { ComponentBuilder } from '@/builders/ComponentBuilder';

export function FilterPanel({ config }) {
  const { fields = [], layout = {} } = config;

  return (
    <Card className="mb-6">
      <Form layout="vertical">
        <Row gutter={[16, 16]}>
          {fields.map((field, index) => (
            <Col key={index} span={field.colSpan || 6}>
              <ComponentBuilder type="formField" config={field} />
            </Col>
          ))}
        </Row>
      </Form>
    </Card>
  );
}