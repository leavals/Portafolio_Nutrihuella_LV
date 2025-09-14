import React from 'react';

export const TextField = ({label, error, ...props}: any) => (
  <label className="block mb-3">
    <span className="nh-label">{label}</span>
    <input {...props} className="nh-input" />
    {error && <p className="nh-error">{error}</p>}
  </label>
);

export const PasswordField = ({label, error, ...props}: any) => (
  <label className="block mb-3">
    <span className="nh-label">{label}</span>
    <input type="password" {...props} className="nh-input" />
    {error && <p className="nh-error">{error}</p>}
  </label>
);

export const DateField = ({label, error, ...props}: any) => (
  <label className="block mb-3">
    <span className="nh-label">{label}</span>
    {/* type="date" despliega calendario nativo */}
    <input type="date" {...props} className="nh-input" />
    {error && <p className="nh-error">{error}</p>}
  </label>
);

export const SelectField = ({label, error, children, ...props}: any) => (
  <label className="block mb-3">
    <span className="nh-label">{label}</span>
    <select {...props} className="nh-input">{children}</select>
    {error && <p className="nh-error">{error}</p>}
  </label>
);
