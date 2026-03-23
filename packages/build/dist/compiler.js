import { extname } from "node:path";
import { transformSync } from "esbuild";
function parseRscDirective(sourceCode) {
  const trimmed = sourceCode.trimStart();
  if (trimmed.startsWith("'use client'") || trimmed.startsWith('"use client"')) return "client";
  if (trimmed.startsWith("'use server'") || trimmed.startsWith('"use server"')) return "server";
  return null;
}
function loaderFromPath(modulePath) {
  const extension = extname(modulePath);
  switch (extension) {
    case ".ts":
      return "ts";
    case ".tsx":
      return "tsx";
    case ".jsx":
      return "jsx";
    default:
      return "js";
  }
}
function compileSource(modulePath, sourceCode) {
  const result = transformSync(sourceCode, {
    loader: loaderFromPath(modulePath),
    sourcemap: true,
    sourcefile: modulePath,
    format: "esm",
    target: "es2022",
    jsx: "automatic",
    tsconfigRaw: {
      compilerOptions: {
        jsx: "react-jsx"
      }
    }
  });
  return {
    code: result.code,
    map: result.map
  };
}
export {
  compileSource,
  parseRscDirective
};

//# sourceMappingURL=compiler.js.map