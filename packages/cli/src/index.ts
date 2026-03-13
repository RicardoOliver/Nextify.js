#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2] ?? 'nextify-app';
const root = join(process.cwd(), target);

mkdirSync(join(root, 'pages', 'api'), { recursive: true });

writeFileSync(
  join(root, 'package.json'),
  JSON.stringify(
    {
      name: target,
      private: true,
      scripts: {
        dev: 'nextify dev',
        build: 'nextify build',
        start: 'nextify start'
      }
    },
    null,
    2
  )
);

writeFileSync(
  join(root, 'pages', 'index.tsx'),
  `export default function Home() {\n  return <main>Bem-vindo ao Nextify.js</main>;\n}\n`
);

writeFileSync(
  join(root, 'pages', 'api', 'health.ts'),
  `export default async function handler() {\n  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });\n}\n`
);

console.log(`Projeto criado em: ${root}`);
console.log('Próximos passos:');
console.log(`  cd ${target}`);
console.log('  npm install');
console.log('  npm run dev');
