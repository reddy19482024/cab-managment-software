import React, { useEffect, useState } from 'react';
import { Layout, Card, Row, Col, Form, Select, DatePicker, Spin, Button, Table, Tag, Statistic } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams } from 'react-router-dom';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import SidebarComponent from '../Sidebar';
import configLoader from '../../utils/configLoader';

const { RangePicker } = DatePicker;
const { Content } = Layout;

const ReportPageBuilder = ({ configName }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [filters, setFilters] = useState({});
  const [collapsed, setCollapsed] = useState(true);
  const [form] = Form.useForm();
  const params = useParams();

  useEffect(() => {
    loadReportConfig();
  }, [configName]);

  useEffect(() => {
    if (config) {
      loadReportData();
    }
  }, [config, filters]);

  const loadReportConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig);
      // Initialize filters with default values if they exist
      if (loadedConfig?.filters?.defaultValues) {
        setFilters(loadedConfig.filters.defaultValues);
        form.setFieldsValue(loadedConfig.filters.defaultValues);
      }
    } catch (error) {
      console.error("Error loading report config:", error);
    } finally {
      setLoading(false);
    }
  };
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const constructApiUrl = (endpoint) => {
    const baseUrl = import.meta.env.VITE_API_URL;
    // Remove any leading slash from the endpoint
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Remove any trailing slash from baseUrl and combine
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const reportData = {};
      const authHeaders = getAuthHeaders();

      // Load summary data if it exists
      if (config.summary?.items) {
        for (const item of config.summary.items) {
          if (item.data?.api) {
            try {
              let endpoint = item.data.api.endpoint;
              if (params) {
                Object.keys(params).forEach(param => {
                  endpoint = endpoint.replace(`{${param}}`, params[param]);
                });
              }

              const response = await fetch(constructApiUrl(endpoint), {
                method: item.data.api.method || 'GET',
                headers: {
                  ...authHeaders,
                  ...item.data.api.headers
                }
              });

              if (response.ok) {
                const result = await response.json();
                reportData[`summary_${item.title}`] = result;
              } else {
                console.warn(`Using fallback data for ${item.title}`);
                reportData[`summary_${item.title}`] = item.data.fallback;
              }
            } catch (error) {
              console.error(`Error loading summary data for ${item.title}:`, error);
              reportData[`summary_${item.title}`] = item.data.fallback;
            }
          }
        }
      }

      // Load section data
      for (const section of config.sections) {
        if (section.data?.api) {
          try {
            let endpoint = section.data.api.endpoint;
            
            if (params) {
              Object.keys(params).forEach(param => {
                endpoint = endpoint.replace(`{${param}}`, params[param]);
              });
            }

            const response = await fetch(constructApiUrl(endpoint), {
              method: section.data.api.method || 'GET',
              headers: {
                ...authHeaders,
                ...section.data.api.headers
              },
              ...(filters && section.data.api.method !== 'GET' ? {
                body: JSON.stringify(filters)
              } : {})
            });

            if (response.ok) {
              const result = await response.json();
              reportData[section.id] = result;
            } else {
              console.warn(`Using fallback data for section ${section.id}`);
              reportData[section.id] = section.data.fallback;
            }
          } catch (error) {
            console.error(`Error loading data for section ${section.id}:`, error);
            reportData[section.id] = section.data.fallback;
          }
        } else if (section.data?.fallback) {
          reportData[section.id] = section.data.fallback;
        }
      }
      
      setData(reportData);
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (values) => {
    setFilters(values);
  };

  const renderChart = (section) => {
    if (!section.chart || !section.data) return null;
    
    const chartConfig = section.chart;
    const chartData = data[section.id] || section.data.fallback || [];

    switch (chartConfig.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartConfig.xAxis.dataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartConfig.series.map((serie) => (
                <Line
                  key={serie.dataKey}
                  type="monotone"
                  dataKey={serie.dataKey}
                  stroke={serie.color}
                  name={serie.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartConfig.xAxis.dataKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartConfig.series.map((serie) => (
                <Bar
                  key={serie.dataKey}
                  dataKey={serie.dataKey}
                  fill={serie.color}
                  name={serie.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={chartConfig.dataKey}
                nameKey={chartConfig.nameKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderInfoCard = (section) => {
    const sectionData = data[section.id] || section.data.fallback;
    return (
      <div className="info-card">
        {section.fields?.map(field => (
          <div key={field.key} style={{ marginBottom: '8px' }}>
            <strong>{field.label}:</strong> {sectionData[field.key]}
          </div>
        ))}
      </div>
    );
  };

  const renderTable = (section) => {
    const tableData = data[section.id] || section.data.fallback;
    const columns = section.columns.map(column => {
      if (column.render?.type === 'tag') {
        return {
          ...column,
          render: (text) => (
            <Tag color={column.render.colorMap[text.toLowerCase()]}>
              {text}
            </Tag>
          )
        };
      }
      return column;
    });

    // Configure pagination with proper showTotal function
    const paginationConfig = {
      ...section.pagination,
      showTotal: section.pagination?.showTotal ? 
        (total, range) => `${range[0]}-${range[1]} of ${total} items` : 
        undefined
    };

    return (
      <Table
      columns={columns}
      dataSource={tableData}
      pagination={paginationConfig}
      rowKey={(record) => record.id || Math.random().toString()}
    />
    );
  };

  const renderSummaryStats = () => {
    if (!config.summary) return null;

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {config.summary.items.map((item, index) => (
          <Col key={index} span={24 / config.summary.items.length}>
            <Card>
              <Statistic
                title={item.title}
                value={data[`summary_${item.title}`] || item.data.fallback}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  if (loading && !config) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <Layout>
      {config.layout.header.enabled && (
        <Layout.Header 
          style={{
            ...config.layout.header.style,
            position: 'fixed',
            width: '100%',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {config.layout.header.logo && (
              <img 
                src={config.layout.header.logo} 
                alt="Logo" 
                style={{ height: '32px', marginRight: '24px' }}
              />
            )}
            {config.layout.sidebar?.enabled && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px' }}
              />
            )}
          </div>
        </Layout.Header>
      )}
      
      <Layout style={{ marginTop: config.layout.header.enabled ? 64 : 0 }}>
        {config.layout.sidebar?.enabled && (
          <SidebarComponent 
            config={config}
            collapsed={collapsed}
            onCollapse={setCollapsed}
          />
        )}
        
        <Layout style={{ 
          transition: 'all 0.2s',
          marginLeft: config.layout.sidebar?.enabled 
            ? (collapsed ? `${config.layout.sidebar.collapsedWidth}px` : `${config.layout.sidebar.width}px`)
            : 0
        }}>
          <Content style={{
            ...config.layout.content.style,
            minHeight: config.layout.header.enabled ? 'calc(100vh - 64px)' : '100vh',
            padding: '24px'
          }}>
            {/* Summary Statistics */}
            {renderSummaryStats()}

            {/* Filters */}
            {config.filters && (
              <Card style={{ marginBottom: '24px' }}>
                <Form
                  form={form}
                  layout="horizontal"
                  onFinish={handleFilterChange}
                  initialValues={config.filters.defaultValues}
                >
                  <Row gutter={16}>
                    {config.filters.items.map((filter) => (
                      <Col key={filter.name} span={filter.span || 6}>
                        <Form.Item 
                          name={filter.name} 
                          label={filter.label}
                          rules={filter.required ? [{ required: true, message: `Please select ${filter.label}` }] : []}
                        >
                          {filter.type === 'date-range' ? (
                            <RangePicker style={{ width: '100%' }} />
                          ) : filter.type === 'select' ? (
                            <Select
                              placeholder={filter.placeholder}
                              options={filter.options}
                              mode={filter.mode}
                              allowClear
                            />
                          ) : null}
                        </Form.Item>
                      </Col>
                    ))}
                    <Col span={24} style={{ textAlign: 'right' }}>
                      <Button type="primary" htmlType="submit">
                        Apply Filters
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card>
            )}

            {/* Content Sections */}
            <Row gutter={[16, 16]}>
              {config.sections
                .filter(section => !section.visibleFor || section.visibleFor.includes(params.type))
                .map((section) => (
                  <Col key={section.id} span={section.span || 24}>
                    <Card 
                      title={section.title}
                      extra={section.description}
                      loading={loading}
                    >
                      {section.type === 'info-card' ? renderInfoCard(section) :
                       section.type === 'chart' ? renderChart(section) :
                       section.type === 'table' ? renderTable(section) : null}
                    </Card>
                  </Col>
                ))}
            </Row>
          </Content>

          {config.layout.footer.enabled && (
            <Layout.Footer style={{ ...config.layout.footer.style, width: '100%' }}>
              {config.layout.footer.text}
              <div style={{ marginTop: 8 }}>
                {config.layout.footer.links?.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url}
                    style={{ marginLeft: index > 0 ? 16 : 0 }}
                  >
                    {link.text}
                  </a>
                ))}
              </div>
            </Layout.Footer>
          )}
        </Layout>
      </Layout>
    </Layout>
  );
};

ReportPageBuilder.propTypes = {
  configName: PropTypes.string.isRequired
};

export default ReportPageBuilder;