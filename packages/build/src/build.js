import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { compileSource, parseRscDirective } from './compiler.js';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const PERFORMANCE_BUDGET = {
  maxSingleAssetKb: 170,
  maxTotalJsKb: 350
};

const SUPPORTED_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'];

function hashContent(content) {
  return createHash('sha1').update(content).digest('hex');
}

function listSourceFiles(rootDir) {
  if (!existsSync(rootDir)) return [];

  const files = [];
  const queue = [rootDir];
  while (queue.length) {
    const current = queue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) queue.push(fullPath);
      else if (SUPPORTED_EXTENSIONS.includes(extname(entry.name))) files.push(fullPath);
    }
  }

  return files.sort();
}

function parseDependencySpecifiers(sourceCode) {
  const dependencies = new Set();
  const importRegex = /(?:import\s+(?:[^'";]+\s+from\s+)?|export\s+[^'";]+\s+from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;
  let match = importRegex.exec(sourceCode);
  while (match) {
    dependencies.add(match[1]);
    match = importRegex.exec(sourceCode);
  }

  return [...dependencies];
}

function resolveDependencyPath(modulePath, dependencySpecifier) {
  if (!dependencySpecifier.startsWith('.')) return null;

  const baseCandidate = resolve(dirname(modulePath), dependencySpecifier);
  const extension = extname(baseCandidate);

  if (extension && existsSync(baseCandidate)) return baseCandidate;

  for (const ext of SUPPORTED_EXTENSIONS) {
    const withExt = `${baseCandidate}${ext}`;
    if (existsSync(withExt)) return withExt;
  }

  for (const ext of SUPPORTED_EXTENSIONS) {
    const withIndex = join(baseCandidate, `index${ext}`);
    if (existsSync(withIndex)) return withIndex;
  }

  return null;
}

function buildModuleGraph(sourceFiles) {
  const moduleGraph = new Map();

  for (const modulePath of sourceFiles) {
    const sourceCode = readFileSync(modulePath, 'utf8');
    const dependencies = parseDependencySpecifiers(sourceCode)
      .map((specifier) => resolveDependencyPath(modulePath, specifier))
      .filter(Boolean);

    const compiled = compileSource(modulePath, sourceCode);

    moduleGraph.set(modulePath, {
      sourceCode,
      sourceHash: hashContent(sourceCode),
      dependencies,
      compiledCode: compiled.code,
      compiledMap: compiled.map,
      rscDirective: parseRscDirective(sourceCode)
    });
  }

  return moduleGraph;
}

function writeModuleArtifact(modulePath, moduleInfo, srcDir, distDir, shouldWrite) {
  const relativeModulePath = relative(srcDir, modulePath);
  const outputFilePath = join(distDir, relativeModulePath).replace(/\.[^.]+$/, '.js');
  const sourceMapFilePath = `${outputFilePath}.map`;

  if (shouldWrite || !existsSync(outputFilePath) || !existsSync(sourceMapFilePath)) {
    mkdirSync(dirname(outputFilePath), { recursive: true });
    const transpiledSource = `${moduleInfo.compiledCode}\n//# sourceMappingURL=${relative(dirname(outputFilePath), sourceMapFilePath)}`;
    writeFileSync(outputFilePath, transpiledSource, 'utf8');
    writeFileSync(sourceMapFilePath, moduleInfo.compiledMap, 'utf8');
  }

  return { outputFilePath, sourceMapFilePath };
}

function loadBuildCache(cacheFilePath) {
  if (!existsSync(cacheFilePath)) return { modules: {} };
  try {
    return JSON.parse(readFileSync(cacheFilePath, 'utf8'));
  } catch {
    return { modules: {} };
  }
}

function ensureActionableError(error, modulePath) {
  const reason = error instanceof Error ? error.message : String(error);
  return new Error(`Falha ao processar módulo ${modulePath}: ${reason}`);
}

function partitionModules(modules, chunkCount) {
  const chunks = Array.from({ length: Math.min(chunkCount, modules.length) }, () => []);
  modules.forEach((modulePath, index) => {
    chunks[index % chunks.length].push(modulePath);
  });

  return chunks;
}

async function processModuleChunk({ chunk, moduleGraph, srcDir, distDir, previousCache, nextCacheModules }) {
  const profile = [];
  for (const modulePath of chunk) {
    const startedAt = performance.now();
    const moduleInfo = moduleGraph.get(modulePath);
    const dependencyHashes = moduleInfo.dependencies.map(
      (dependencyPath) => moduleGraph.get(dependencyPath)?.sourceHash ?? 'external'
    );
    const graphHash = hashContent([moduleInfo.sourceHash, ...dependencyHashes].join(':'));
    const previousEntry = previousCache.modules?.[modulePath];
    const cacheHit = previousEntry?.graphHash === graphHash;

    try {
      const artifact = writeModuleArtifact(modulePath, moduleInfo, srcDir, distDir, !cacheHit);
      nextCacheModules[modulePath] = {
        graphHash,
        outputFilePath: artifact.outputFilePath,
        sourceMapFilePath: artifact.sourceMapFilePath,
        updatedAt: new Date().toISOString(),
        rscDirective: moduleInfo.rscDirective
      };

      profile.push({
        module: relative(srcDir, modulePath),
        status: cacheHit ? 'cache-hit' : 'rebuilt',
        dependencies: moduleInfo.dependencies.map((dependency) => relative(srcDir, dependency)),
        rscDirective: moduleInfo.rscDirective,
        durationMs: Number((performance.now() - startedAt).toFixed(2))
      });
    } catch (error) {
      throw ensureActionableError(error, modulePath);
    }
  }

  return profile;
}

async function buildIncrementalArtifacts({ moduleGraph, srcDir, distDir, cacheFilePath, parallelism }) {
  const previousCache = loadBuildCache(cacheFilePath);
  const sortedModules = [...moduleGraph.keys()].sort();

  const nextCache = {
    generatedAt: new Date().toISOString(),
    modules: {},
    buildConfig: { parallelism }
  };

  const chunks = partitionModules(sortedModules, parallelism);
  const profile = (await Promise.all(
    chunks.map((chunk) =>
      processModuleChunk({ chunk, moduleGraph, srcDir, distDir, previousCache, nextCacheModules: nextCache.modules })
    )
  ))
    .flat()
    .sort((a, b) => a.module.localeCompare(b.module));

  writeFileSync(cacheFilePath, JSON.stringify(nextCache, null, 2));

  return {
    profile,
    cache: {
      file: cacheFilePath,
      modulesTracked: sortedModules.length,
      cacheHits: profile.filter((entry) => entry.status === 'cache-hit').length
    }
  };
}

function createRscManifest(profile) {
  return {
    generatedAt: new Date().toISOString(),
    client: profile.filter((entry) => entry.rscDirective === 'client').map((entry) => entry.module),
    server: profile.filter((entry) => entry.rscDirective === 'server').map((entry) => entry.module)
  };
}

export function collectJsAssets(dir) {
  try {
    const assets = [];
    const queue = [dir];

    while (queue.length) {
      const current = queue.pop();
      const entries = readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(current, entry.name);
        if (entry.isDirectory()) queue.push(fullPath);
        else if (fullPath.endsWith('.js')) assets.push({ file: fullPath, size: statSync(fullPath).size });
      }
    }

    return assets;
  } catch {
    return [];
  }
}

export function evaluatePerformanceBudget(assets) {
  const totalKb = Number((assets.reduce((acc, asset) => acc + asset.size, 0) / 1024).toFixed(2));
  const largest = [...assets].sort((a, b) => b.size - a.size)[0];
  const largestKb = largest ? Number((largest.size / 1024).toFixed(2)) : 0;

  const violations = [];
  if (largestKb > PERFORMANCE_BUDGET.maxSingleAssetKb) {
    violations.push(`Maior asset JS (${largestKb}KB) excedeu limite de ${PERFORMANCE_BUDGET.maxSingleAssetKb}KB.`);
  }
  if (totalKb > PERFORMANCE_BUDGET.maxTotalJsKb) {
    violations.push(`Total JS (${totalKb}KB) excedeu limite de ${PERFORMANCE_BUDGET.maxTotalJsKb}KB.`);
  }

  return {
    budget: PERFORMANCE_BUDGET,
    totalKb,
    largestAssetKb: largestKb,
    status: violations.length ? 'fail' : 'pass',
    violations
  };
}

export async function runBuild(cwd = process.cwd(), options = {}) {
  const srcDir = join(cwd, 'src');
  const distDir = join(cwd, 'dist');
  const cacheDir = join(cwd, '.nextify');
  const cacheFilePath = join(cacheDir, 'build-cache.json');
  const parallelism = options.parallelism ?? Math.max(1, Math.min(cpus().length, 8));

  mkdirSync(distDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  const sourceFiles = listSourceFiles(srcDir);
  const moduleGraph = buildModuleGraph(sourceFiles);
  const incrementalBuild = await buildIncrementalArtifacts({
    moduleGraph,
    srcDir,
    distDir,
    cacheFilePath,
    parallelism
  });

  const routeManifest = {
    generatedAt: new Date().toISOString(),
    note: 'Manifesto de rotas gerado pelo build system do Nextify.',
    modules: incrementalBuild.profile.map((entry) => entry.module)
  };
  writeFileSync(join(distDir, 'route-manifest.json'), JSON.stringify(routeManifest, null, 2));
  writeFileSync(join(distDir, 'build-profile.json'), JSON.stringify(incrementalBuild.profile, null, 2));
  writeFileSync(join(distDir, 'rsc-manifest.json'), JSON.stringify(createRscManifest(incrementalBuild.profile), null, 2));

  writeFileSync(
    join(distDir, 'hmr-manifest.json'),
    JSON.stringify(
      {
        targetLatencyMs: 100,
        estimatedLatencyMs: incrementalBuild.cache.cacheHits > 0 ? 40 : 120,
        cacheHits: incrementalBuild.cache.cacheHits
      },
      null,
      2
    )
  );

  const assets = collectJsAssets(distDir);
  const performanceBudget = evaluatePerformanceBudget(assets);
  writeFileSync(join(distDir, 'performance-budget.json'), JSON.stringify(performanceBudget, null, 2));

  if (performanceBudget.status === 'fail') {
    throw new Error(`Build bloqueado por regressão crítica de performance: ${performanceBudget.violations.join(' ')}`);
  }

  return {
    ...performanceBudget,
    incrementalBuild
  };
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  runBuild();
}
