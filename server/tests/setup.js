import WebSocket from 'ws';

// Polyfill WebSocket globally for Node < 22 so Supabase Realtime client doesn't crash during tests
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}
