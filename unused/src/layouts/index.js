// src/layouts/index.js
import DefaultLayout from './DefaultLayout';
import AuthLayout from './AuthLayout';

export {
  DefaultLayout,
  AuthLayout
};

// Layout Type mapping for dynamic usage
export const LAYOUT_TYPES = {
  default: DefaultLayout,
  auth: AuthLayout
};