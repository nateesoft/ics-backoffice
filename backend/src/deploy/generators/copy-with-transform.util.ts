import * as fs from 'fs';
import * as path from 'path';

// Resolves at runtime via process.cwd() (the running app's own working directory, = the `backend`
// or `frontend` workspace root when started normally) rather than __dirname — matches this repo's
// existing convention (e.g. ServeStaticModule/AuthService resolve `uploads/` the same way) and
// stays correct regardless of how `nest build`/`next build` lay out compiled output under dist/.
export function repoRoot(workspace: 'backend' | 'frontend'): string {
  const cwd = process.cwd();
  return cwd.endsWith(workspace) ? cwd : path.join(cwd, '..', workspace);
}

export interface CopySpec {
  from: string; // absolute path to the live source file
  to: string;   // path relative to the generated project's root
  transforms?: Array<[string | RegExp, string]>;
}

// Copies a real, currently-running source file into a generated project — this is what guarantees
// the generated app's Collections/CustomEndpoints engine (or renderer components on the frontend
// side) is byte-identical to what's actually running today, re-copied fresh on every deploy rather
// than maintained as a second, driftable copy.
export function copyWithTransform(spec: CopySpec, targetRoot: string): void {
  let content = fs.readFileSync(spec.from, 'utf-8');
  for (const [pattern, replacement] of spec.transforms ?? []) {
    content = content.replace(pattern as RegExp, replacement);
  }
  writeGeneratedFile(targetRoot, spec.to, content);
}

export function writeGeneratedFile(targetRoot: string, relPath: string, content: string): void {
  const destPath = path.join(targetRoot, relPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf-8');
}
