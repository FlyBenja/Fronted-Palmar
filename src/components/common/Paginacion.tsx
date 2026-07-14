interface PaginacionProps {
  total: number;
  pagina: number;
  porPagina?: number;
  onCambiarPagina: (pagina: number) => void;
}

function Paginacion({ total, pagina, porPagina = 10, onCambiarPagina }: PaginacionProps) {
  const totalPaginas = Math.max(Math.ceil(total / porPagina), 1);

  if (total <= porPagina) {
    return null;
  }

  const paginas = Array.from({ length: totalPaginas }, (_, index) => index + 1);

  return (
    <div className="paginacion-palmar">
      <small>
        Página {pagina} de {totalPaginas} · {total} registro(s)
      </small>

      <div className="btn-group">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={pagina === 1}
          onClick={() => onCambiarPagina(pagina - 1)}
        >
          Anterior
        </button>

        {paginas.map((numeroPagina) => (
          <button
            type="button"
            key={numeroPagina}
            className={
              numeroPagina === pagina
                ? 'btn btn-sm btn-palmar'
                : 'btn btn-sm btn-outline-secondary'
            }
            onClick={() => onCambiarPagina(numeroPagina)}
          >
            {numeroPagina}
          </button>
        ))}

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={pagina === totalPaginas}
          onClick={() => onCambiarPagina(pagina + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default Paginacion;
