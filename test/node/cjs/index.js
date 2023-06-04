if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!');
}

const { cookie } = require('@elysiajs/cookie');

if (typeof cookie !== 'function') {
  throw new Error('❌ CommonJS Node.js failed');
}

console.log('✅ CommonJS Node.js works!');
