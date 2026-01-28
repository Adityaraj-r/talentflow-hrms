import React from 'react';

const ChartWidget = ({ title, children, actions }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
};

export default ChartWidget;
