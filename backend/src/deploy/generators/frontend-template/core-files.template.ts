export function renderPackageJson(name: string): string {
  const pkg = {
    name,
    version: '0.0.1',
    private: true,
    scripts: {
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      '@jsonforms/core': '^3.8.0',
      '@jsonforms/react': '^3.8.0',
      '@jsonforms/vanilla-renderers': '^3.8.0',
      'next': '16.2.7',
      'react': '19.2.4',
      'react-dom': '19.2.4',
    },
    devDependencies: {
      '@tailwindcss/postcss': '^4',
      '@types/node': '^20',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      'tailwindcss': '^4',
      'typescript': '^5',
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

export function renderNextConfigTs(): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
`;
}

export function renderTsconfigJson(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'react-jsx',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2) + '\n';
}

export function renderPostcssConfig(): string {
  return `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;
}

export function renderLayoutTsx(): string {
  return `import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

export function renderGlobalsCss(): string {
  return `@import "tailwindcss";

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
`;
}

export function renderNextEnvDts(): string {
  return `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;
}
