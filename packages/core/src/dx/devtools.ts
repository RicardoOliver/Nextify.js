import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export type Diagnostic = {
  code: string;
  message: string;
  hint?: string;
};

export function formatDiagnostic(diagnostic: Diagnostic) {
  return `[${diagnostic.code}] ${diagnostic.message}${diagnostic.hint ? `\nHint: ${diagnostic.hint}` : ''}`;
}

export function generateProjectDocs(options: { outDir?: string; sections: Record<string, string> }) {
  const outDir = options.outDir ?? join(process.cwd(), 'docs', 'generated');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'AUTO_DOCS.md');
  const content = ['# Nextify Auto Docs', '']
    .concat(Object.entries(options.sections).map(([title, body]) => `## ${title}\n\n${body}`))
    .join('\n\n');

  writeFileSync(outFile, content, 'utf8');
  return outFile;
}
