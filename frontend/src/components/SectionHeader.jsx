import { React } from 'react';

function SectionHeader({ title, subtitle }) {
  return (
    <div
      className="container-fluid"
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #D9E5DC',
        borderBottom: '1px solid #D9E5DC',
      }}
   >
      <div className="container py-4 py-md-5">
        <h2
          className="m-0 text-center"
          style={{ color: '#2F4F3E', fontWeight: 800, fontSize: 28 }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="m-0 mt-2 text-center" style={{ color: '#5B6B62', fontSize: 14 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default SectionHeader;


