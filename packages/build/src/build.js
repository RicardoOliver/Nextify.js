import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  existsSync
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, resolve } from 'node:path';
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
  if (!existsSync(rootDir)) {
    return [];
  }

  const files = [];
  const queue = [rootDir];

  while (queue.length) {
    const current = queue.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (SUPPORTED_EXTENSIONS.includes(extname(entry.name))) {
        files.push(fullPath);
      }
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
  if (!dependencySpecifier.startsWith('.')) {
    return null;
  }

  const baseCandidate = resolve(dirname(modulePath), dependencySpecifier);
  const extension = extname(baseCandidate);

  if (extension && existsSync(baseCandidate)) {
    return baseCandidate;
  }

  for (const ext of SUPPORTED_EXTENSIONS) {
    const candidateWithExt = `${baseCandidate}${ext}`;
    if (existsSync(candidateWithExt)) {
      return candidateWithExt;
    }
  }

  for (const ext of SUPPORTED_EXTENSIONS) {
    const indexCandidate = join(baseCandidate, `index${ext}`);
    if (existsSync(indexCandidate)) {
      return indexCandidate;
    }
  }

  return null;
}

function buildModuleGraph(sourceFiles) {
  const moduleGraph = new Map();

  for (const modulePath of sourceFiles) {
    const sourceCode = readFileSync(modulePath, 'utf8');
    const dependencySpecifiers = parseDependencySpecifiers(sourceCode);
    const dependencies = dependencySpecifiers
      .map((specifier) => resolveDependencyPath(modulePath, specifier))
      .filter(Boolean);

    moduleGraph.set(modulePath, {
      sourceCode,
      sourceHash: hashContent(sourceCode),
      dependencies
    });
  }

  return moduleGraph;
}

function createModuleSourceMap(relativeModulePath, sourceCode) {
  const totalLines = sourceCode.split('\n').length;
  const mappings = Array.from({ length: totalLines }, () => 'AAAA').join(';');

  return {
    version: 3,
    file: relativeModulePath.replace(/\.[^.]+$/, '.js'),
    sources: [relativeModulePath],
    names: [],
    mappings
  };
}

function writeModuleArtifact(modulePath, moduleInfo, srcDir, distDir) {
  const relativeModulePath = relative(srcDir, modulePath);
  const outputFilePath = join(distDir, relativeModulePath).replace(/\.[^.]+$/, '.js');
  mkdirSync(dirname(outputFilePath), { recursive: true });

  const sourceMap = createModuleSourceMap(relativeModulePath, moduleInfo.sourceCode);
  const sourceMapFilePath = `${outputFilePath}.map`;

  const transpiledSource = `${moduleInfo.sourceCode}\n//# sourceMappingURL=${relative(dirname(outputFilePath), sourceMapFilePath)}`;

  writeFileSync(outputFilePath, transpiledSource, 'utf8');
  writeFileSync(sourceMapFilePath, JSON.stringify(sourceMap, null, 2), 'utf8');

  return { outputFilePath, sourceMapFilePath };
}

function loadBuildCache(cacheFilePath) {
  if (!existsSync(cacheFilePath)) {
    return { modules: {} };
  }

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

function buildIncrementalArtifacts({ moduleGraph, srcDir, distDir, cacheFilePath }) {
  const previousCache = loadBuildCache(cacheFilePath);
  const nextCache = { generatedAt: new Date().toISOString(), modules: {} };
  const sortedModules = [...moduleGraph.keys()].sort();
  const profile = [];

  for (const modulePath of sortedModules) {
    const startedAt = performance.now();
    const moduleInfo = moduleGraph.get(modulePath);
    const dependencyHashes = moduleInfo.dependencies.map(
      (dependencyPath) => moduleGraph.get(dependencyPath)?.sourceHash ?? 'external'
    );
    const graphHash = hashContent([moduleInfo.sourceHash, ...dependencyHashes].join(':'));
    const previousEntry = previousCache.modules?.[modulePath];

    const cached = previousEntry?.graphHash === graphHash;

    try {
      const artifact = writeModuleArtifact(modulePath, moduleInfo, srcDir, distDir);
      nextCache.modules[modulePath] = {
        graphHash,
        outputFilePath: artifact.outputFilePath,
        sourceMapFilePath: artifact.sourceMapFilePath,
        updatedAt: new Date().toISOString()
      };

      profile.push({
        module: relative(srcDir, modulePath),
        status: cached ? 'cache-hit' : 'rebuilt',
        dependencies: moduleInfo.dependencies.map((dependency) => relative(srcDir, dependency)),
        durationMs: Number((performance.now() - startedAt).toFixed(2))
      });
    } catch (error) {
      throw ensureActionableError(error, modulePath);
    }
  }

  writeFileSync(cacheFilePath, JSON.stringify(nextCache, null, 2));

  return {
    profile,
    cache: {
      file: cacheFilePath,
      modulesTracked: sortedModules.length
    }
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
        if (entry.isDirectory()) {
          queue.push(fullPath);
          continue;
        }

        if (fullPath.endsWith('.js')) {
          assets.push({ file: fullPath, size: statSync(fullPath).size });
        }
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
    violations.push(
      `Maior asset JS (${largestKb}KB) excedeu limite de ${PERFORMANCE_BUDGET.maxSingleAssetKb}KB.`
    );
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

export function runBuild(cwd = process.cwd()) {
  const srcDir = join(cwd, 'src');
  const distDir = join(cwd, 'dist');
  const cacheDir = join(cwd, '.nextify');
  const cacheFilePath = join(cacheDir, 'build-cache.json');

  mkdirSync(distDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  const sourceFiles = listSourceFiles(srcDir);
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  const moduleGraph = buildModuleGraph(sourceFiles);
  const incrementalBuild = buildIncrementalArtifacts({ moduleGraph, srcDir, distDir, cacheFilePath });

  const routeManifest = {
    generatedAt: new Date().toISOString(),
    note: 'Manifesto de rotas gerado pelo build system do Nextify.',
    modules: incrementalBuild.profile.map((entry) => entry.module)
  };
  writeFileSync(join(distDir, 'route-manifest.json'), JSON.stringify(routeManifest, null, 2));

  writeFileSync(join(distDir, 'build-profile.json'), JSON.stringify(incrementalBuild.profile, null, 2));

  const assets = collectJsAssets(distDir);
  const performanceBudget = evaluatePerformanceBudget(assets);
  writeFileSync(join(distDir, 'performance-budget.json'), JSON.stringify(performanceBudget, null, 2));

  console.log('Build incremental concluído. Artefatos em dist/.');
  console.log(`Módulos processados: ${incrementalBuild.cache.modulesTracked}. Cache em ${incrementalBuild.cache.file}.`);
  console.log(`Performance budget: ${performanceBudget.status.toUpperCase()}.`);

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
