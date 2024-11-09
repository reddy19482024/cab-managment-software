import React from 'react';
import ReactDOM from 'react-dom/client';  // <-- Update to 'react-dom/client'
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')); // <-- Use 'createRoot' here directly
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
