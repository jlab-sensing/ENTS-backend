import { React } from 'react';

function FeatureCard({
  accentColor = '#3A5A40',
  title = 'Feature',
  description = 'Description',
  bullets,
  ctaText = 'Learn More',
  ctaHref = '#',
}) {
  return (
    <div className="position-relative w-100 h-100" style={{ margin: '0 auto' }}>
      <div
        className="position-absolute"
        style={{ left: 16, bottom: 16, backgroundColor: accentColor, height: '100%', width: '100%', borderRadius: 12, opacity: 0.19 }}
      />

      <div
        className="position-relative rounded h-100 d-flex flex-column"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          border: '1px solid #E6ECE4',
          borderRadius: 12,
          padding: 'clamp(16px, 4.5vw, 28px)',
          minHeight: 360,
        }}
      >
        <div style={{ height: 8, width: 96, backgroundColor: accentColor, borderRadius: 4 }} />

        <div className="mt-3" style={{ fontSize: 'clamp(20px, 3.4vw, 28px)', fontWeight: 800, lineHeight: 1.25, color: '#364F42' }}>{title}</div>
        {Array.isArray(bullets) && bullets.length > 0 ? (
          <ul className="mb-4" style={{ listStyle: 'none', padding: 0, margin: '14px 0 0 0' }}>
            {bullets.map((item, idx) => (
              <li key={idx} className="d-flex align-items-start" style={{ color: '#5B6B62', fontSize: 'clamp(14px, 2.8vw, 15px)', lineHeight: 1.7, marginBottom: 12 }}>
                <span className="me-2" aria-hidden="true" style={{ lineHeight: 0, marginTop: 2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#3A5A40" opacity="0.15" />
                    <path d="M7 12l3 3 7-7" stroke="#3A5A40" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4" style={{ color: '#5B6B62', fontSize: 'clamp(14px, 2.8vw, 15px)', lineHeight: 1.75 }}>{description}</p>
        )}

        {ctaHref && ctaHref !== '#' ? (
          <a
            href={ctaHref}
            className="fw-bold mt-auto"
            style={{ color: accentColor, textDecoration: 'none', fontSize: 14 }}
          >
            {ctaText}
          </a>
        ) : (
          <div className="mt-auto" />
        )}
      </div>
    </div>
  );
}

export default FeatureCard;


