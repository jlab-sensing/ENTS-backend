import { React } from 'react';
import FeatureCard from './FeatureCard';

function FeatureSection() {
  return (
    <section
      className="container-fluid d-flex align-items-center py-5"
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(40% 35% at 15% 10%, rgba(58,90,64,0.18) 0%, rgba(58,90,64,0) 60%), ' +
          'radial-gradient(35% 30% at 85% 15%, rgba(134,184,138,0.28) 0%, rgba(134,184,138,0) 60%), ' +
          'radial-gradient(60% 55% at 50% 110%, rgba(220,230,220,0.65) 0%, rgba(220,230,220,0) 70%), ' +
          'linear-gradient(180deg, #E9EEE5 0%, #DCE5D7 100%)',
      }}
    >
      <div className="container">
        <div className="text-center mb-4">
        </div>
        <div className="row gx-5 gy-5 gy-md-6 justify-content-center align-items-stretch">
          <div className="col-12 col-sm-12 col-md-6 col-lg-5 col-xl-4 d-flex">
            <FeatureCard
              accentColor="#B45309"
              title="Low-Cost, Scalable Hardware"
              bullets={[
                '$53 custom board per node',
                '25× cheaper than RocketLogger',
                'Built for large-scale deployments',
                'Live streaming',
              ]}
              ctaText="Learn more"
              ctaHref=""
            />
          </div>
          <div className="col-12 col-sm-12 col-md-6 col-lg-5 col-xl-4 d-flex">
            <FeatureCard
              accentColor="#3A5A40"
              title="Accurate, Flexible Monitoring"
              bullets={[
                'Measures voltage + current',
                'Configurable gain / shunt resistors',
                '~1% measurement accuracy',
                'Stable for long‑term logging',
              ]}
              ctaText="Learn more"
              ctaHref=""
            />
          </div>
          <div className="col-12 col-sm-12 col-md-6 col-lg-5 col-xl-4 d-flex">
            <FeatureCard
              accentColor="#2563EB"
              title="Designed for Real-World Deployment"
              bullets={[
                'Low power (battery/harvesting ready)',
                'Open‑source HW & firmware',
                'Teensy / Arduino compatible',
                'Proven in outdoor deployments',
              ]}
              ctaText="Learn more"
              ctaHref=""
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;


