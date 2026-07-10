import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'public/sw.js',
      'public/workbox-*.js',
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Local-first hydration and media lifecycles intentionally update state from effects.
      'react-hooks/set-state-in-effect': 'off',
      // The particle animation schedules its stable callback recursively with requestAnimationFrame.
      'react-hooks/immutability': 'off',
    },
  },
];

export default config;
