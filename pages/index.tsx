const containerStyle = {
  minHeight: '100vh',
  margin: 0,
  padding: '48px 28px',
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
  background:
    'radial-gradient(circle at 0% 0%, #f5f8ff 0%, #eef2ff 30%, #f8fafc 65%, #ffffff 100%)',
  color: '#0f172a',
};

const frameStyle = {
  width: 'min(1100px, 100%)',
  margin: '0 auto',
  borderRadius: '24px',
  background: 'rgba(255, 255, 255, 0.92)',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  boxShadow: '0 24px 80px -45px rgba(15, 23, 42, 0.45)',
  overflow: 'hidden',
};

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  borderRadius: '999px',
  background: '#e0e7ff',
  color: '#3730a3',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  padding: '8px 14px',
  marginBottom: '18px',
};

const headingStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 4vw, 3.5rem)',
  lineHeight: 1.12,
  letterSpacing: '-0.03em',
  maxWidth: '860px',
};

const subtitleStyle = {
  margin: '18px 0 0',
  fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
  lineHeight: 1.65,
  color: '#334155',
  maxWidth: '680px',
};

const ctaRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  marginTop: '28px',
};

const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  padding: '13px 18px',
  fontWeight: 700,
  fontSize: '14px',
  letterSpacing: '0.01em',
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  background: '#ffffff',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '13px 18px',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  borderTop: '1px solid rgba(148, 163, 184, 0.22)',
};

const statCardStyle = {
  padding: '26px',
  borderRight: '1px solid rgba(148, 163, 184, 0.22)',
};

const statValueStyle = {
  margin: 0,
  fontSize: '1.55rem',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#0f172a',
};

const statLabelStyle = {
  margin: '6px 0 0',
  color: '#64748b',
  fontWeight: 500,
};

const stats = [
  { value: '99,99%', label: 'Disponibilidade alvo' },
  { value: '< 120ms', label: 'Latência P95 em edge' },
  { value: '24/7', label: 'Monitoramento contínuo' },
  { value: 'SOC 2', label: 'Pronto para compliance' },
];

export default function Home() {
  return (
    <main style={containerStyle}>
      <section style={frameStyle}>
        <div style={{ padding: '42px clamp(22px, 4vw, 56px) 36px' }}>
          <span style={badgeStyle}>🚀 Plataforma Enterprise Ready</span>
          <h1 style={headingStyle}>Construa produtos digitais com padrão de big tech</h1>
          <p style={subtitleStyle}>
            Nextify.js combina velocidade de execução, segurança e uma experiência de desenvolvimento
            moderna para times que querem escalar com previsibilidade.
          </p>

          <div style={ctaRowStyle}>
            <button type="button" style={primaryButtonStyle}>Iniciar projeto</button>
            <button type="button" style={secondaryButtonStyle}>Ver arquitetura</button>
          </div>
        </div>

        <div style={statsGridStyle}>
          {stats.map((stat, index) => (
            <article
              key={stat.label}
              style={{
                ...statCardStyle,
                borderRight:
                  index === stats.length - 1
                    ? 'none'
                    : '1px solid rgba(148, 163, 184, 0.22)',
              }}
            >
              <p style={statValueStyle}>{stat.value}</p>
              <p style={statLabelStyle}>{stat.label}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
