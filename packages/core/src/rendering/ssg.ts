type StaticRecord = {
  html: string;
  generatedAt: number;
  revalidateSeconds?: number;
};

const ssgStore = new Map<string, StaticRecord>();

export function setStaticPage(pathname: string, html: string, revalidateSeconds?: number) {
  ssgStore.set(pathname, { html, generatedAt: Date.now(), revalidateSeconds });
}

export function getStaticPage(pathname: string): { html: string; isStale: boolean } | null {
  const record = ssgStore.get(pathname);
  if (!record) return null;

  const isStale =
    typeof record.revalidateSeconds === 'number'
      ? Date.now() - record.generatedAt > record.revalidateSeconds * 1000
      : false;

  return { html: record.html, isStale };
}
