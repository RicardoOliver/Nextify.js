export type IslandDescriptor = {
  id: string;
  entry: string;
};

export function defineIsland(id: string, entry: string): IslandDescriptor {
  return { id, entry };
}

export function renderIslandShell(id: string, props: Record<string, unknown> = {}, fallbackHtml = '') {
  const serializedProps = encodeURIComponent(JSON.stringify(props));
  return `<div data-nextify-island="${id}" data-nextify-props="${serializedProps}">${fallbackHtml}</div>`;
}

export function getIslandHydrationScript(islands: IslandDescriptor[]) {
  const map = Object.fromEntries(islands.map((island) => [island.id, island.entry]));

  return `<script type="module">
const islandMap = ${JSON.stringify(map)};
for (const node of document.querySelectorAll('[data-nextify-island]')) {
  const id = node.getAttribute('data-nextify-island');
  const entry = id ? islandMap[id] : undefined;
  if (!entry) continue;
  const propsRaw = node.getAttribute('data-nextify-props') || '%7B%7D';
  const props = JSON.parse(decodeURIComponent(propsRaw));
  import(entry).then((mod) => {
    if (typeof mod.hydrate === 'function') {
      mod.hydrate(node, props);
    }
  });
}
</script>`;
}
