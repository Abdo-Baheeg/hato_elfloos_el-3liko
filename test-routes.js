/**
 * Route Testing Script
 * Run this to verify all registered routes
 */

const app = require('./app');

function printRoutes(stack, prefix = '') {
  stack.forEach((middleware) => {
    if (middleware.route) {
      // Route middleware
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      console.log(`${methods} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      // Router middleware
      const routerPath = middleware.regexp.source
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace('^', '');
      
      printRoutes(middleware.handle.stack, prefix + routerPath);
    }
  });
}

console.log('\n=== Registered Routes ===\n');
printRoutes(app._router.stack);
console.log('\n========================\n');
