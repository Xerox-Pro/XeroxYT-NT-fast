
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { PlaylistProvider } from './contexts/PlaylistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ApiKeyProvider>
        <SubscriptionProvider>
          <PlaylistProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </PlaylistProvider>
        </SubscriptionProvider>
      </ApiKeyProvider>
    </BrowserRouter>
  </React.StrictMode>
);
