import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ConvexClientProvider } from './ConvexClientProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ConvexClientProvider>
        <App />
      </ConvexClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
