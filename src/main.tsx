// src/main.tsx
import 'leaflet/dist/leaflet.css'; // <-- ADICIONE ESTA LINHA

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { DataProvider } from './contexts/DataContext.tsx'
import { FirebaseProvider } from './contexts/FirebaseContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FirebaseProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </FirebaseProvider>
    </ThemeProvider>
  </React.StrictMode>,
)