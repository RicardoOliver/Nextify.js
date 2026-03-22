import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export type RenderMode = 'ssr' | 'ssg' | 'isr';

export type RenderTask = {
  route: string;
  html: string;
  mode: RenderMode;
  revalidateSeconds?: number;
};

export class AdvancedRenderer {
  private readonly distDir: string;

  constructor(distDir = join(process.cwd(), '.nextify-render')) {
    this.distDir = distDir;
    mkdirSync(this.distDir, { recursive: true });
  }

  render(task: RenderTask) {
    const outPath = join(this.distDir, `${task.route === '/' ? 'index' : task.route.replaceAll('/', '_')}.html`);
    const payload = {
      route: task.route,
      mode: task.mode,
      generatedAt: new Date().toISOString(),
      revalidateSeconds: task.revalidateSeconds ?? null,
      html: task.html
    };

    writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    return outPath;
  }

  read(route: string) {
    const file = join(this.distDir, `${route === '/' ? 'index' : route.replaceAll('/', '_')}.html`);
    if (!existsSync(file)) return null;

    return JSON.parse(readFileSync(file, 'utf8')) as {
      route: string;
      mode: RenderMode;
      generatedAt: string;
      revalidateSeconds: number | null;
      html: string;
    };
  }

  shouldRevalidate(route: string, now = Date.now()) {
    const page = this.read(route);
    if (!page || page.mode !== 'isr' || !page.revalidateSeconds) return false;

    const generatedAtMs = Date.parse(page.generatedAt);
    return now - generatedAtMs > page.revalidateSeconds * 1000;
  }
}

export function partialHydrationScript(componentId: string, entrypoint: string) {
  return `<script type="module">import('${entrypoint}').then((m)=>m.hydrate?.(document.querySelector('[data-partial-id="${componentId}"]')))</script>`;
}

export function predictivePrefetchScript(routes: string[]) {
  return `<script>const routes=${JSON.stringify(routes)};window.addEventListener('mousemove',()=>{for(const route of routes){const l=document.createElement('link');l.rel='prefetch';l.href=route;document.head.appendChild(l);}} ,{once:true});</script>`;
}
