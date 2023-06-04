if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!');
}

import { cookie } from '@elysiajs/cookie';

if (typeof cookie !== 'function') {
  throw new Error('❌ ESM Node.js failed');
}

console.log('✅ ESM Node.js works!');
