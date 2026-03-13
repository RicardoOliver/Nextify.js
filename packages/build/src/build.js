import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
writeFileSync(
  'dist/route-manifest.json',
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      note: 'Manifesto de rotas gerado pelo build system PoC do Nextify.'
    },
    null,
    2
  )
);

console.log('Build concluído. Artefatos em dist/.');
