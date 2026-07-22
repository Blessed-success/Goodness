import React from 'react';

const Card = ({ children, className = '', padded = true, hoverable = false, as: Tag = 'div', ...props }) => {
  return (
    <Tag
      className={`rounded-xl bg-white shadow-card ${hoverable ? 'transition duration-200 hover:-translate-y-1 hover:shadow-card-hover' : ''}
        ${padded ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Card;
