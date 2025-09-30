import { React } from 'react';

function PresentationSection() {
  const slidesUrl = 'https://sensors.soe.ucsc.edu/assets/pdf/ENSsys%202022%20MFC.pptx.pdf';

  return (
    <section
      className="container-fluid py-5 d-flex align-items-center"
      style={{
        background: 'linear-gradient(180deg, #F2F5F0 0%, #E8EEE6 100%)',
        minHeight: '100vh',
      }}
    >
      <div className="container py-lg-5">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-end mb-3">
          <div className="d-flex gap-2">
            <a href={slidesUrl} target="_blank" rel="noreferrer" className="btn btn-outline-success btn-sm">Open in new tab</a>
            <a href={slidesUrl} download className="btn btn-success btn-sm" style={{ backgroundColor: '#3A5A40', borderColor: '#3A5A40' }}>Download</a>
          </div>
        </div>

        <div style={{ height: '90vh', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: '#FFFFFF' }}>
          <iframe
            title="DirtViz Presentation"
            src={`${slidesUrl}#page=1&zoom=page-width`}
            style={{ width: '100%', height: '100%', border: 0 }}
            allow="fullscreen"
          />
        </div>

      </div>
    </section>
  );
}

export default PresentationSection;


