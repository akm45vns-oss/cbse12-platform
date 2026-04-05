#!/usr/bin/env node
// Wrapper to run quiz generation with PM2
// Uses default parameters defined in topUpTo5.js
import('./src/scripts/topUpTo5.js').catch(err => {
  console.error('Failed to start quiz generator:', err);
  process.exit(1);
});

