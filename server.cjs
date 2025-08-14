(async () => {
    const module = await import('./dist/index.js');
    module.default(); // Adjust this based on the default export or named exports in `index.js`
  })();