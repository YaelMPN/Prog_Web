import type { Vista } from '../App';

interface Props {
  vista: Vista;
  onCambiar: (v: Vista) => void;
}

export default function Navbar({ vista, onCambiar }: Props) {
  const item = (v: Vista, etiqueta: string) => (
    <li className="nav-item">
      <button
        type="button"
        className={`nav-link nav-btn text-white ${vista === v ? 'active' : ''}`}
        onClick={() => onCambiar(v)}
      >
        {etiqueta}
      </button>
    </li>
  );

  return (
    <nav className="navbar navbar-expand-sm navbar-dark app-navbar">
      <div className="container">
        <span className="navbar-brand brand">
          <span className="brand-mark">T</span> Gestión de Trámites
        </span>
        <ul className="navbar-nav ms-auto flex-row gap-2">
          {item('registro', 'Registrar Trámite')}
          {item('historial', 'Historial de Folios')}
        </ul>
      </div>
    </nav>
  );
}
