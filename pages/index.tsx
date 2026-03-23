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
      </section>
    </main>
  );
}
