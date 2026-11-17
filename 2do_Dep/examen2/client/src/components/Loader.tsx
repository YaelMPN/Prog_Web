interface Props {
  texto?: string;
  duracionMs?: number;
}

export default function Loader({ texto = 'Procesando…', duracionMs = 1500 }: Props) {
  return (
    <div className="loader-box" role="status" aria-live="polite">
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="spinner-border spinner-border-sm text-orange" aria-hidden="true" />
        <strong>{texto}</strong>
      </div>
      <div className="progress" style={{ height: 6 }}>
        <div className="progress-bar loader-bar" style={{ animationDuration: `${duracionMs}ms` }} />
      </div>
    </div>
  );
}
