
import { useMemo, useState } from 'react';

const docsUrl = 'https://github.com/RicardoOliver/Nextify.js#readme';
const createCommand = 'npx create-nextify@latest my-app';

const featureCards = [
  {
    title: 'Vite-Powered HMR',
    description: 'Mudanças refletidas em milissegundos, sem recarregamento completo de página.',
    icon: '⚡',
  },
  {
    title: 'File-based Routing',
    description: 'Transforme arquivos em rotas automaticamente, com zero configuração manual.',
    icon: '📁',
  },
  {
    title: 'API Routes',
    description: 'Crie backends em /pages/api com Request/Response Web APIs.',
    icon: '🛠️',
  },
  {
    title: 'TypeScript First',
    description: 'DX premium com tipagem estática e app aliases prontos para escalar.',
    icon: '🧩',
  },
  {
    title: 'Monorepo Ready',
    description: 'Compartilhe código entre múltiplos apps com arquitetura modular.',
    icon: '📦',
  },
  {
    title: 'Plugin System',
    description: 'Extenda o framework com plugins e middleware customizados.',
    icon: '🔌',
  },
];

const pageStyle = {
  minHeight: '100vh',
  margin: 0,
  padding: '40px 20px 60px',
  background:
    'radial-gradient(circle at 0 0, rgba(59,130,246,0.22) 0%, rgba(2,6,23,1) 30%, rgba(2,6,23,1) 100%)',
  color: '#e2e8f0',
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
};

const containerStyle = {
  width: 'min(1180px, 100%)',
  margin: '0 auto',
};

export default function Home() {
  const [copied, setCopied] = useState(false);

  const commandLabel = useMemo(
    () => (copied ? 'Comando copiado ✓' : 'Get Started →'),
    [copied]
  );

  async function onGetStarted() {
    try {
      await navigator.clipboard.writeText(createCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.alert(`Copie manualmente:\n${createCommand}`);
    }
  }

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(96,165,250,0.45)',
              background: 'rgba(30,41,59,0.55)',
              color: '#93c5fd',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.08em',
              marginBottom: '18px',
            }}
          >
            V1.0 • ENTERPRISE READY
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.2rem, 7vw, 5.2rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              color: '#f8fafc',
            }}
          >
            The modern
            <br />
            React framework
          </h1>
          <p
            style={{
              maxWidth: '760px',
              margin: '20px auto 0',
              color: '#94a3b8',
              lineHeight: 1.65,
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            }}
          >
            Build full-stack React applications com file-based routing, API routes e HMR instantâneo
            com performance de nível big tech.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onGetStarted}
              style={{
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                color: '#0b1220',
                fontWeight: 800,
                fontSize: '15px',
                padding: '13px 24px',
                cursor: 'pointer',
                minWidth: '180px',
              }}
            >
              {commandLabel}
            </button>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.35)',
                color: '#e2e8f0',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '15px',
                padding: '13px 24px',
                minWidth: '160px',
                display: 'inline-flex',
                justifyContent: 'center',
              }}
            >
              Read Docs
            </a>
          </div>

          <code
            style={{
              marginTop: '24px',
              display: 'inline-block',
              borderRadius: '12px',
              border: '1px solid rgba(51,65,85,1)',
              background: '#020617',
              color: '#93c5fd',
              padding: '12px 16px',
              fontSize: '14px',
            }}
          >
            $ {createCommand}
          </code>
        </div>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              style={{
                borderRadius: '16px',
                border: '1px solid rgba(30,41,59,0.9)',
                background: 'rgba(2, 6, 23, 0.72)',
                padding: '20px',
              }}
            >
              <p style={{ margin: 0, fontSize: '22px' }}>{feature.icon}</p>
              <h3 style={{ margin: '12px 0 0', fontSize: '1.08rem', color: '#f1f5f9' }}>{feature.title}</h3>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', lineHeight: 1.55 }}>{feature.description}</p>
            </article>
          ))}
        </section>

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
