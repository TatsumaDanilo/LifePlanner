
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Prevent formdata-polyfill from overwriting fetch in environments where it's read-only
if (typeof FormData !== 'undefined' && !FormData.prototype.keys) {
  (FormData.prototype as any).keys = function* () {
    // Minimal implementation to satisfy the check
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
