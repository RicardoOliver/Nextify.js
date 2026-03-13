const ssgStore = new Map();
export function setStaticPage(pathname, html, revalidateSeconds) {
    ssgStore.set(pathname, { html, generatedAt: Date.now(), revalidateSeconds });
}
export function getStaticPage(pathname) {
    const record = ssgStore.get(pathname);
    if (!record)
        return null;
    const isStale = typeof record.revalidateSeconds === 'number'
        ? Date.now() - record.generatedAt > record.revalidateSeconds * 1000
        : false;
    return { html: record.html, isStale };
}
