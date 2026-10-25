import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/nunito-sans/wght.css';
import './styles.css';
import { SessionProvider } from './integration/api';
import { App } from './App';
import { BrowserRouter } from 'react-router';
import { AssistantProvider } from './components/Assistant';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><SessionProvider><AssistantProvider><App /></AssistantProvider></SessionProvider></BrowserRouter></React.StrictMode>,
);
