import { React } from 'react';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';

function LandingFooter() {
  return (
    <div className="container-fluid px-0" style={{ overflowX: 'hidden', backgroundColor: '#fff' }}>

      {/* Contribute Section */}
      <section className="container-fluid py-5" style={{ backgroundColor: '#FFF' }}>
        <div className="text-center py-3">
          <h2 style={{ fontWeight: 'bold', color: '#2F4F3E', marginBottom: 16 }}>Contribute to DirtViz</h2>
          <p className="mb-4" style={{ color: '#4B5563' }}>
            DirtViz is open-source. Explore the codebase, report issues, or contribute features on GitHub.
          </p>
          <a
            href="https://github.com/jlab-sensing/DirtViz"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#3A5A40',
              border: '2px solid #3A5A40',
              borderRadius: 0,
              padding: '12px 28px',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <GitHubIcon style={{ fontSize: 22 }} />
            Visit GitHub Repo
          </a>
        </div>
      </section>

      <footer style={{ color: '#FFFFFF', backgroundImage: 'linear-gradient(90deg, #2F4F3E 0%, #3A5A40 50%, #86B88A 100%)', overflowX: 'hidden' }}>
        <div className="row justify-content-around mb-0 pt-5 mx-0 px-4">
          {/* Branding & Lab Info */}
          <div className="col-xl-3 col-md-6 my-auto">
            <ul className="list-unstyled mt-md-3 mt-5">
              <li style={{ marginBottom: 8 }}>
                <img
                  src="/assets/dirtviz-logo.png"
                  alt="DirtViz logo"
                  style={{ height: 'calc(34px + (64 - 34) * ((100vw - 360px) / (1600 - 360)))', width: 'auto' }}
                />
              </li>
              <li style={{ color: 'rgb(196, 193, 193)' }}>© 2025 DirtViz - UCSC JLab</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="col-xl-2 col-md-3 pt-4">
            <ul className="list-unstyled">
              <li className="mt-md-0 mt-4" style={{ fontWeight: 'bold' }}>Quick Links</li>
              <li><a href="/" style={{ color: 'rgb(196, 193, 193)', textDecoration: 'none' }}>Home</a></li>
              <li><a href="/dashboard" style={{ color: 'rgb(196, 193, 193)', textDecoration: 'none' }}>Dashboard</a></li>
              <li><a href="https://github.com/jlab-sensing/DirtViz" style={{ color: 'rgb(196, 193, 193)', textDecoration: 'none' }}>GitHub Repo</a></li>
            </ul>
          </div>

          {/* Research & Resources */}
          <div className="col-xl-3 col-md-3 pt-4">
            <ul className="list-unstyled">
              <li className="mt-md-0 mt-4" style={{ fontWeight: 'bold' }}>Research & Resources</li>
              <li>
                <a href="https://sensors.soe.ucsc.edu/assets/pdf/madden2022smfcCurrentSense.pdf" style={{ color: 'rgb(196, 193, 193)', textDecoration: 'none' }}>Research Papers (ENSys2022)</a>
              </li>
              <li>
                <a href="https://sensors.soe.ucsc.edu/assets/pdf/ENSsys%202022%20MFC.pptx.pdf" style={{ color: 'rgb(196, 193, 193)', textDecoration: 'none' }}>Slides</a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="col-xl-3 col-md-6 pt-4">
            <ul className="list-unstyled">
              <li className="mt-md-0 mt-4" style={{ fontWeight: 'bold' }}>Social</li>
              <li className="social" style={{ marginTop: 8 }}>
                <a href="https://github.com/jlab-sensing/DirtViz" aria-label="GitHub" style={{ color: 'rgb(255, 255, 255)', marginRight: 10, textDecoration: 'none' }}>
                  <GitHubIcon style={{ cursor: 'pointer', fontSize: 41, margin: '5px 2px' }} />
                </a>
                <a href="https://sensors.soe.ucsc.edu/" target="_blank" rel="noreferrer" aria-label="Website" style={{ color: 'rgb(255, 255, 255)', marginRight: 10, textDecoration: 'none' }}>
                  <LanguageIcon style={{ cursor: 'pointer', fontSize: 41, margin: '5px 10px' }} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="row justify-content-center mx-0 px-3 py-3 pt-3">
          <div className="col text-center">
            <p style={{ color: 'rgb(196, 193, 193)', marginBottom: 0 }}>
              Made by JLab at UCSC. Part of the EnTS project.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingFooter;