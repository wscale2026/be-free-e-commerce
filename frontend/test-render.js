import React from 'react';
import { renderToString } from 'react-dom/server';
import { BrowserRouter } from 'react-router-dom';
import App from './src/App.tsx';

try {
  console.log("Trying to render App...");
  // We can't easily compile TSX on the fly with raw node without esbuild/ts-node.
} catch (e) {
  console.log("ERROR", e);
}
