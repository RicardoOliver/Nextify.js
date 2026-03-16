#!/usr/bin/env node
import http from 'node:http';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
function createProject(target = 'nextify-app') {
    const root = join(process.cwd(), target);
    if (existsSync(root)) {
        console.error(`Erro: a pasta "${target}" já existe.`);
        process.exit(1);
    }
    mkdirSync(join(root, 'pages', 'api'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({
        name: target,
        private: true,
        type: 'module',
        scripts: {
            dev: 'nextify dev',
            build: 'nextify build',
            start: 'nextify start',
        },
        dependencies: {
            react: '^18.3.1',
            'react-dom': '^18.3.1',
        },
        devDependencies: {
            'create-nextify': 'latest',
            vite: '^5.4.19',
            '@vitejs/plugin-react': '^4.3.4',
            '@types/react': '^18.3.1',
            '@types/react-dom': '^18.3.1',
            typescript: '^5.0.0',
        },
    }, null, 2));
    writeFileSync(join(root, 'pages', 'index.tsx'), `export default function Home() {

  return (

    <main style={{
      minHeight:"100vh",
      background:"#020617",
      color:"white",
      fontFamily:"Inter, sans-serif",
      padding:"80px"
    }}>

      <section style={{ textAlign:"center", marginBottom:"100px" }}>

        <h1 style={{
          fontSize:"72px",
          fontWeight:"bold",
          background:"linear-gradient(90deg,#6366f1,#7c3aed)",
          WebkitBackgroundClip:"text",
          color:"transparent"
        }}>
          Nextify ⚡
        </h1>

        <p style={{ fontSize:"22px", opacity:0.8 }}>
          The modern React framework powered by Vite
        </p>

        <div style={{ marginTop:"40px" }}>

          <button style={{
            padding:"16px 32px",
            borderRadius:"12px",
            border:"none",
            background:"linear-gradient(90deg,#6366f1,#7c3aed)",
            color:"white",
            fontWeight:"bold",
            cursor:"pointer"
          }}>
            Get Started
          </button>

        </div>

      </section>


      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
        gap:"30px",
        marginBottom:"120px"
      }}>

        <div style={{
          background:"#0f172a",
          padding:"40px",
          borderRadius:"14px",
          border:"1px solid #1e293b"
        }}>
          ⚡ Fast Dev
          <p>Instant HMR powered by Vite</p>
        </div>

        <div style={{
          background:"#0f172a",
          padding:"40px",
          borderRadius:"14px",
          border:"1px solid #1e293b"
        }}>
          📂 File Routing
          <p>Pages automatically become routes</p>
        </div>

        <div style={{
          background:"#0f172a",
          padding:"40px",
          borderRadius:"14px",
          border:"1px solid #1e293b"
        }}>
          🔌 API Routes
          <p>Backend endpoints inside /pages/api</p>
        </div>

        <div style={{
          background:"#0f172a",
          padding:"40px",
          borderRadius:"14px",
          border:"1px solid #1e293b"
        }}>
          ⚛ React + TSX
          <p>Modern React development</p>
        </div>

      </section>


      <section style={{ textAlign:"center" }}>

        <h2>Install</h2>

        <pre style={{
          marginTop:"20px",
          background:"#020617",
          border:"1px solid #1e293b",
          padding:"30px",
          borderRadius:"12px",
          maxWidth:"500px",
          margin:"auto"
        }}>
npx create-nextify-app my-app
cd my-app
npm run dev
        </pre>

      </section>

    </main>

  )
}
`);
    writeFileSync(join(root, 'pages', 'api', 'health.ts'), `export default async function handler() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
}
`);
    writeFileSync(join(root, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            jsx: 'react-jsx',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
        },
        include: ['pages', 'src'],
    }, null, 2));
    console.log(`\n✔ Projeto criado em: ${root}`);
    console.log('\nPróximos passos:\n');
    console.log(`  cd ${target}`);
    console.log('  npm install');
    console.log('  npm run dev\n');
}
async function runDevServer(port) {
    try {
        // devServer.js está embutido no próprio pacote create-nextify (dist/devServer.js)
        const devServerUrl = new URL('./devServer.js', import.meta.url).href;
        const { startDevServer } = await import(devServerUrl);
        await startDevServer({ root: process.cwd(), port });
    }
    catch (err) {
        console.error('[nextify] Erro ao iniciar dev server:', err.message);
        process.exit(1);
    }
}
function runProdServer(port) {
    const server = http.createServer((_req, res) => {
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end('Nextify production server ativo 🚀');
    });
    server.listen(port, () => {
        console.log(`Nextify start em http://localhost:${port}`);
    });
}
function runBuild() {
    mkdirSync(join(process.cwd(), 'dist'), { recursive: true });
    writeFileSync(join(process.cwd(), 'dist', 'route-manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString() }, null, 2));
    console.log('✔ Build concluído. Artefatos em dist/');
}
function showHelp() {
    console.log(`
Uso:

  create-nextify [nome-do-projeto]

ou

  nextify create [nome-do-projeto]
  nextify dev [porta]
  nextify build
  nextify start [porta]
`);
}
const args = process.argv.slice(2);
if (args.length === 0) {
    showHelp();
    process.exit(0);
}
const command = args[0];
const portArg = Number(process.env.PORT ?? args[1] ?? 3000);
const port = Number.isFinite(portArg) ? portArg : 3000;
switch (command) {
    case 'create':
        createProject(args[1]);
        break;
    case 'dev':
        runDevServer(port);
        break;
    case 'build':
        runBuild();
        break;
    case 'start':
        runProdServer(port);
        break;
    default: createProject(command);
}
