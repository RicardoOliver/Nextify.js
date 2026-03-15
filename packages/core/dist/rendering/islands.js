export function defineIsland(id, entry) {
    return { id, entry };
}
export function renderIslandShell(id, props = {}, fallbackHtml = '') {
    const serializedProps = encodeURIComponent(JSON.stringify(props));
    return `<div data-nextify-island="${id}" data-nextify-props="${serializedProps}">${fallbackHtml}</div>`;
}
export function getIslandHydrationScript(islands) {
    const map = Object.fromEntries(islands.map((island) => [island.id, island.entry]));
    return `<script type="module">\nconst islandMap = ${JSON.stringify(map)};\nfor (const node of document.querySelectorAll('[data-nextify-island]')) {\n  const id = node.getAttribute('data-nextify-island');\n  const entry = id ? islandMap[id] : undefined;\n  if (!entry) continue;\n  const propsRaw = node.getAttribute('data-nextify-props') || '%7B%7D';\n  const props = JSON.parse(decodeURIComponent(propsRaw));\n  import(entry).then((mod) => {\n    if (typeof mod.hydrate === 'function') {\n      mod.hydrate(node, props);\n    }\n  });\n}\n</script>`;
}
