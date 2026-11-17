import { useState } from 'react';
import Navbar from './components/Navbar';
import RegistroTramiteView from './views/RegistroTramiteView';
import HistorialView from './views/HistorialView';

export type Vista = 'registro' | 'historial';

export default function App() {
  const [vista, setVista] = useState<Vista>('registro');

  return (
    <div className="app-shell">
      <Navbar vista={vista} onCambiar={setVista} />
      <main className="container py-4">
        {vista === 'registro'
          ? <RegistroTramiteView onIrHistorial={() => setVista('historial')} />
          : <HistorialView />}
      </main>
      <footer className="app-footer text-center py-3">
        Portal de Gestión y Consulta de Trámites
      </footer>
    </div>
  );
}
