import path from 'node:path';
export function toRoutePath(filePath) {
    const clean = filePath
        .replace(/\\/g, '/')
        .replace(/^pages\//, '')
        .replace(/\.(t|j)sx?$/, '')
        .replace(/index$/, '');
    if (!clean)
        return '/';
    return ('/' +
        clean
            .split('/')
            .filter(Boolean)
            .map((segment) => segment.replace(/^\[(.+)\]$/, ':$1'))
            .join('/'));
}
export function buildRouteManifest(files) {
    return files.map((file) => {
        const normalized = file.replace(/\\/g, '/');
        const routePath = toRoutePath(normalized);
        const base = path.basename(normalized);
        const kind = normalized.includes('/api/')
            ? 'api'
            : base.startsWith('middleware')
                ? 'middleware'
                : 'page';
        return { file: normalized, routePath, kind };
    });
}
