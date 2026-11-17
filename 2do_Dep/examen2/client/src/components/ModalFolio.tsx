import { useState } from 'react';

interface Props {
  folio: string;
  onCerrar: () => void;
  onIrHistorial: () => void;
}

export default function ModalFolio({ folio, onCerrar, onIrHistorial }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(folio);
    } catch {
      const t = document.createElement('textarea');
      t.value = folio;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content folio-modal">
            <div className="modal-body text-center p-4">
              <div className="check-circle mb-3">✔</div>
              <h4 className="fw-bold mb-1">Trámite registrado correctamente</h4>
              <p className="text-secondary-custom mb-3">
                Conserve su folio único de seguimiento para consultas posteriores.
              </p>
              <div className="folio-display">{folio}</div>
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center mt-4">
                <button type="button" className="btn btn-outline-dark" onClick={copiar}>
                  {copiado ? '✔ Folio copiado' : 'Copiar folio'}
                </button>
                <button type="button" className="btn btn-orange" onClick={onIrHistorial}>
                  Ir al historial
                </button>
              </div>
              <button type="button" className="btn btn-link text-secondary-custom mt-2" onClick={onCerrar}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
