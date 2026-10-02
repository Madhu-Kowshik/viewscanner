import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';

// Register Progressive Web App service worker with automatic updates and stale cache cleanup
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('OmniPDF update available. New version will activate immediately.');
  },
  onOfflineReady() {
    console.info('OmniPDF is ready for complete offline document processing.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
