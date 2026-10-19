import React from 'react';

export const Loader = ({
  message = 'Loading...',
  size = 'md', // 'sm' | 'md' | 'lg'
  inline = false,
}) => {
  if (inline) {
    return <span className={`spinner spinner-${size}`} aria-label={message} />;
  }

  return (
    <div className="loader-container">
      <div className={`spinner spinner-${size}`} />
      {message && <p className="text-muted" style={{ fontSize: '0.9rem' }}>{message}</p>}
    </div>
  );
};

export default Loader;
