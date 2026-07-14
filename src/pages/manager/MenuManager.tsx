import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  actualizarCategoriaMenu,
  actualizarMenuItem,
  crearCategoriaMenu,
  eliminarCategoriaMenu,
  reordenarCategoriasMenu,
  crearMenuItem,
  obtenerCategoriasMenu,
  obtenerMenuItemsManager,
} from '../../api/menuApi';
import { obtenerProductosInventario } from '../../api/inventarioApi';
import { alertaConfirmacionEliminar, alertaError, alertaExito } from '../../components/SweetAlert';
import type {
  CategoriaMenu,
  CrearMenuItemIngredientePayload,
  CrearMenuItemPayload,
  MenuItem,
  ProductoInventario,
} from '../../types';
import '../../styles/restaurante.css';

const apiUrl = import.meta.env.VITE_API_URL;

type TipoMenu = 'COMIDA' | 'BEBIDA' | 'POSTRE' | 'EXTRA' | 'OTRO';

function numero(valor: string | number | undefined | null) {
  return Number(valor || 0);
}

function dinero(valor: string | number | undefined | null) {
  return `Q${numero(valor).toFixed(2)}`;
}

function construirUrlImagen(imagenUrl: string | null) {
  if (!imagenUrl) {
    return '';
  }

  if (imagenUrl.startsWith('http')) {
    return imagenUrl;
  }

  return `${apiUrl}${imagenUrl}`;
}


function ordenarCategorias(categorias: CategoriaMenu[]) {
  return [...categorias].sort((a, b) => {
    const ordenA = Number(a.orden || 0);
    const ordenB = Number(b.orden || 0);

    if (ordenA !== ordenB) {
      return ordenA - ordenB;
    }

    return a.id - b.id;
  });
}

function ordenarItemsPorCategoria(items: MenuItem[], categorias: CategoriaMenu[]) {
  const ordenCategoria = categorias.reduce<Record<number, number>>((mapa, categoria, index) => {
    mapa[categoria.id] = Number(categoria.orden || index + 1);
    return mapa;
  }, {});

  return [...items].sort((a, b) => {
    const ordenA = ordenCategoria[a.categoria_menu_id] || 999999;
    const ordenB = ordenCategoria[b.categoria_menu_id] || 999999;

    if (ordenA !== ordenB) {
      return ordenA - ordenB;
    }

    return a.nombre.localeCompare(b.nombre);
  });
}
function MenuManager() {
  const [categorias, setCategorias] = useState<CategoriaMenu[]>([]);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalVistaMenu, setModalVistaMenu] = useState(false);
  const [categoriaEditarId, setCategoriaEditarId] = useState<number | null>(null);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [categoriaDescripcion, setCategoriaDescripcion] = useState('');

  const [modalPlato, setModalPlato] = useState(false);
  const [platoEditar, setPlatoEditar] = useState<MenuItem | null>(null);
  const [categoriaMenuId, setCategoriaMenuId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('0');
  const [tipo, setTipo] = useState<TipoMenu>('COMIDA');
  const [disponible, setDisponible] = useState(true);
  const [ingredientes, setIngredientes] = useState<CrearMenuItemIngredientePayload[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [cantidadIngrediente, setCantidadIngrediente] = useState('1');
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState('');

  const cargarDatos = async () => {
    setCargando(true);

    try {
      const [categoriasData, productosData, itemsData] = await Promise.all([
        obtenerCategoriasMenu(),
        obtenerProductosInventario(),
        obtenerMenuItemsManager(),
      ]);

      const categoriasOrdenadas = ordenarCategorias(categoriasData);

      setCategorias(categoriasOrdenadas);
      setProductos(productosData.filter((producto) => producto.estado));
      setItems(ordenarItemsPorCategoria(itemsData, categoriasOrdenadas));
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo cargar la información del menú.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const productosPorId = useMemo(() => {
    return productos.reduce<Record<number, ProductoInventario>>((mapa, producto) => {
      mapa[producto.id] = producto;
      return mapa;
    }, {});
  }, [productos]);

  const limpiarFormularioPlato = () => {
    setPlatoEditar(null);
    setCategoriaMenuId(categorias[0] ? String(categorias[0].id) : '');
    setNombre('');
    setDescripcion('');
    setPrecio('0');
    setTipo('COMIDA');
    setDisponible(true);
    setIngredientes([]);
    setProductoSeleccionadoId('');
    setCantidadIngrediente('1');
    setImagen(null);
    setPreviewImagen('');
  };

  const abrirCrearPlato = () => {
    limpiarFormularioPlato();
    setModalPlato(true);
  };

  const abrirEditarPlato = (item: MenuItem) => {
    setPlatoEditar(item);
    setCategoriaMenuId(String(item.categoria_menu_id));
    setNombre(item.nombre);
    setDescripcion(item.descripcion || '');
    setPrecio(String(item.precio));
    setTipo(item.tipo);
    setDisponible(item.disponible);
    setIngredientes(
      (item.ingredientes || []).map((ingrediente) => ({
        producto_inventario_id: ingrediente.producto_inventario_id,
        cantidad_requerida: Number(ingrediente.cantidad_requerida),
      })),
    );
    setProductoSeleccionadoId('');
    setCantidadIngrediente('1');
    setImagen(null);
    setPreviewImagen(item.imagen_url ? construirUrlImagen(item.imagen_url) : '');
    setModalPlato(true);
  };

  const cerrarModalPlato = () => {
    if (guardando) {
      return;
    }

    setModalPlato(false);
    limpiarFormularioPlato();
  };

  const abrirEditarCategoria = (categoria: CategoriaMenu) => {
    setCategoriaEditarId(categoria.id);
    setCategoriaNombre(categoria.nombre);
    setCategoriaDescripcion(categoria.descripcion || '');
    setModalCategoria(true);
  };

  const cerrarModalCategoria = () => {
    if (guardando) return;
    setModalCategoria(false);
    setCategoriaEditarId(null);
    setCategoriaNombre('');
    setCategoriaDescripcion('');
  };

  const guardarCategoriaMenu = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);

    try {
      if (categoriaEditarId) {
        await actualizarCategoriaMenu(categoriaEditarId, {
          nombre: categoriaNombre,
          descripcion: categoriaDescripcion,
        });
        await alertaExito('¡Categoría actualizada!', 'La categoría fue actualizada correctamente.');
      } else {
        await crearCategoriaMenu({
          nombre: categoriaNombre,
          descripcion: categoriaDescripcion,
        });
        await alertaExito('¡Categoría creada!', 'La categoría del menú fue registrada correctamente.');
      }

      setModalCategoria(false);
      setCategoriaEditarId(null);
      setCategoriaNombre('');
      setCategoriaDescripcion('');
      await cargarDatos();
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo guardar la categoría del menú.');
    } finally {
      setGuardando(false);
    }
  };

  const moverCategoria = async (categoriaId: number, direccion: -1 | 1) => {
    const indiceActual = categorias.findIndex((categoria) => categoria.id === categoriaId);
    const indiceNuevo = indiceActual + direccion;

    if (indiceActual < 0 || indiceNuevo < 0 || indiceNuevo >= categorias.length) {
      return;
    }

    const categoriasOrdenadas = [...categorias];
    const [categoriaMovida] = categoriasOrdenadas.splice(indiceActual, 1);
    categoriasOrdenadas.splice(indiceNuevo, 0, categoriaMovida);

    setCategorias(categoriasOrdenadas.map((categoria, index) => ({ ...categoria, orden: index + 1 })));

    try {
      await reordenarCategoriasMenu(
        categoriasOrdenadas.map((categoria, index) => ({ id: categoria.id, orden: index + 1 })),
      );
      await cargarDatos();
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo cambiar el orden de las categorías.');
    }
  };

  const eliminarCategoria = async (categoria: CategoriaMenu) => {
    const confirmado = await alertaConfirmacionEliminar(
      '¿Eliminar categoría?',
      `Se ocultará la categoría "${categoria.nombre}" y sus platos.`,
    );

    if (!confirmado) return;

    try {
      await eliminarCategoriaMenu(categoria.id);
      await cargarDatos();
      await alertaExito('¡Categoría eliminada!', 'La categoría fue eliminada correctamente.');
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo eliminar la categoría.');
    }
  };

  const agregarIngrediente = () => {
    const productoId = Number(productoSeleccionadoId);
    const cantidad = Number(cantidadIngrediente);

    if (!productoId || cantidad <= 0) {
      return;
    }

    setIngredientes((actual) => {
      const existe = actual.find((ingrediente) => ingrediente.producto_inventario_id === productoId);

      if (existe) {
        return actual.map((ingrediente) => {
          if (ingrediente.producto_inventario_id !== productoId) {
            return ingrediente;
          }

          return {
            ...ingrediente,
            cantidad_requerida: ingrediente.cantidad_requerida + cantidad,
          };
        });
      }

      return [
        ...actual,
        {
          producto_inventario_id: productoId,
          cantidad_requerida: cantidad,
        },
      ];
    });

    setProductoSeleccionadoId('');
    setCantidadIngrediente('1');
  };

  const eliminarIngrediente = (productoId: number) => {
    setIngredientes((actual) => actual.filter((ingrediente) => ingrediente.producto_inventario_id !== productoId));
  };

  const cambiarImagen = (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0] || null;

    setImagen(archivo);

    if (archivo) {
      setPreviewImagen(URL.createObjectURL(archivo));
      return;
    }

    setPreviewImagen(platoEditar?.imagen_url ? construirUrlImagen(platoEditar.imagen_url) : '');
  };

  const guardarPlato = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (ingredientes.length === 0) {
      await alertaError('Ingredientes requeridos', 'Agrega al menos un producto de inventario al plato.');
      return;
    }

    setGuardando(true);

    try {
      const payload: CrearMenuItemPayload = {
        categoria_menu_id: Number(categoriaMenuId),
        nombre,
        descripcion,
        precio: Number(precio),
        tipo,
        disponible,
        ingredientes,
        imagen,
      };

      if (platoEditar) {
        await actualizarMenuItem(platoEditar.id, payload);
        await alertaExito('¡Plato actualizado!', 'El plato fue actualizado correctamente.');
      } else {
        await crearMenuItem(payload);
        await alertaExito('¡Plato creado!', 'El plato fue registrado correctamente.');
      }

      setModalPlato(false);
      limpiarFormularioPlato();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo guardar el plato del menú.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div>
          <h1>Menú del restaurante</h1>
          <p>Crea platos con imagen y productos de inventario.</p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setModalVistaMenu(true)}
          >
            Vista menú / categorías
          </button>

          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => { setCategoriaEditarId(null); setCategoriaNombre(''); setCategoriaDescripcion(''); setModalCategoria(true); }}
          >
            Nueva categoría
          </button>

          <button className="btn btn-palmar" type="button" onClick={abrirCrearPlato}>
            Nuevo plato
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando menú...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <h4 className="restaurante-card-title">Platos registrados</h4>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Plato</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Ingredientes</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.imagen_url ? (
                          <img
                            className="restaurante-table-image"
                            src={construirUrlImagen(item.imagen_url)}
                            alt={item.nombre}
                          />
                        ) : (
                          <div className="restaurante-table-image empty">
                            Sin imagen
                          </div>
                        )}
                      </td>

                      <td>
                        <strong>{item.nombre}</strong>
                        <p className="text-muted mb-0">
                          {item.descripcion || 'Sin descripción'}
                        </p>
                      </td>

                      <td>{item.categoria?.nombre || 'Sin categoría'}</td>
                      <td>{dinero(item.precio)}</td>

                      <td>
                        {(item.ingredientes || []).length === 0 ? (
                          <span className="text-muted">Sin ingredientes</span>
                        ) : (
                          <div className="restaurante-ingredient-list compact">
                            {(item.ingredientes || []).map((ingrediente) => (
                              <span
                                key={
                                  ingrediente.id ||
                                  ingrediente.producto_inventario_id
                                }
                              >
                                {ingrediente.producto?.nombre || 'Producto'}:{' '}
                                {ingrediente.cantidad_requerida}{' '}
                                {ingrediente.producto?.unidad_medida || ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            item.disponible
                              ? 'badge text-bg-success'
                              : 'badge text-bg-secondary'
                          }
                        >
                          {item.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>

                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          type="button"
                          onClick={() => abrirEditarPlato(item)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        No hay platos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {modalVistaMenu && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header modal-palmar">
                  <h5 className="modal-title">Vista del menú y orden de categorías</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setModalVistaMenu(false)} />
                </div>

                <div className="modal-body">
                  <p className="text-muted">Puedes cambiar el orden, editar o eliminar categorías. La vista de empleado usa este mismo orden.</p>

                  <div className="restaurante-tabs mb-4">
                    {categorias.map((categoria, index) => (
                      <div className="menu-category-admin-pill" key={categoria.id}>
                        <span className="menu-category-order">#{categoria.orden || index + 1}</span>
                        <span>{categoria.nombre}</span>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => moverCategoria(categoria.id, -1)} disabled={index === 0}>↑</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => moverCategoria(categoria.id, 1)} disabled={index === categorias.length - 1}>↓</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => abrirEditarCategoria(categoria)}>Editar</button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarCategoria(categoria)}>Eliminar</button>
                      </div>
                    ))}
                  </div>

                  {categorias.map((categoria) => {
                    const platosCategoria = items.filter((item) => item.categoria_menu_id === categoria.id);

                    return (
                      <section className="mb-4" key={categoria.id}>
                        <h4 className="restaurante-card-title">{categoria.nombre}</h4>

                        {platosCategoria.length === 0 ? (
                          <div className="alert alert-warning">No hay platos en esta categoría.</div>
                        ) : (
                          <div className="restaurante-menu-grid manager-preview">
                            {platosCategoria.map((item) => (
                              <article className="restaurante-menu-card" key={item.id}>
                                {item.imagen_url ? (
                                  <img className="restaurante-menu-card-image" src={construirUrlImagen(item.imagen_url)} alt={item.nombre} />
                                ) : (
                                  <div className="restaurante-menu-card-image empty">Sin imagen</div>
                                )}
                                <div className="restaurante-menu-card-body">
                                  <span className="badge text-bg-light">{item.tipo}</span>
                                  <h4>{item.nombre}</h4>
                                  <p>{item.descripcion || 'Sin descripción'}</p>
                                </div>
                                <div className="restaurante-menu-card-footer">
                                  <strong>{dinero(item.precio)}</strong>
                                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => abrirEditarPlato(item)}>Editar</button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setModalVistaMenu(false)}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {modalCategoria && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={guardarCategoriaMenu}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">{categoriaEditarId ? 'Editar categoría de menú' : 'Nueva categoría de menú'}</h5>

                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={cerrarModalCategoria}
                      disabled={guardando}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Nombre</label>

                      <input
                        className="form-control"
                        value={categoriaNombre}
                        onChange={(event) => setCategoriaNombre(event.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Descripción</label>

                      <textarea
                        className="form-control"
                        value={categoriaDescripcion}
                        onChange={(event) =>
                          setCategoriaDescripcion(event.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cerrarModalCategoria}
                      disabled={guardando}
                    >
                      Cancelar
                    </button>

                    <button className="btn btn-palmar" disabled={guardando}>
                      {guardando ? 'Guardando...' : categoriaEditarId ? 'Actualizar categoría' : 'Guardar categoría'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}

      {modalPlato && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-plato-dialog">
              <div className="modal-content modal-plato-content">
                <form className="modal-plato-form" onSubmit={guardarPlato}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">
                      {platoEditar ? 'Editar plato' : 'Nuevo plato'}
                    </h5>

                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={cerrarModalPlato}
                      disabled={guardando}
                    />
                  </div>

                  <div className="modal-body modal-plato-body">
                    <div className="row g-3">
                      <div className="col-md-5">
                        <label className="form-label">Categoría</label>

                        <select
                          className="form-select"
                          value={categoriaMenuId}
                          onChange={(event) =>
                            setCategoriaMenuId(event.target.value)
                          }
                          required
                        >
                          <option value="">Selecciona categoría</option>

                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-7">
                        <label className="form-label">Nombre del plato</label>

                        <input
                          className="form-control"
                          value={nombre}
                          onChange={(event) => setNombre(event.target.value)}
                          placeholder="Desayuno chapín"
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Precio</label>

                        <input
                          type="number"
                          className="form-control"
                          value={precio}
                          onChange={(event) => setPrecio(event.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Tipo</label>

                        <select
                          className="form-select"
                          value={tipo}
                          onChange={(event) =>
                            setTipo(event.target.value as TipoMenu)
                          }
                        >
                          <option value="COMIDA">Comida</option>
                          <option value="BEBIDA">Bebida</option>
                          <option value="POSTRE">Postre</option>
                          <option value="EXTRA">Extra</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>

                      <div className="col-md-4 d-flex align-items-end">
                        <div className="form-check form-switch mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={disponible}
                            onChange={(event) =>
                              setDisponible(event.target.checked)
                            }
                            id="platoDisponible"
                          />

                          <label
                            className="form-check-label"
                            htmlFor="platoDisponible"
                          >
                            Disponible
                          </label>
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Descripción</label>

                        <textarea
                          className="form-control"
                          rows={3}
                          value={descripcion}
                          onChange={(event) => setDescripcion(event.target.value)}
                        />
                      </div>

                      <div className="col-md-5">
                        <label className="form-label">Imagen del plato</label>

                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={cambiarImagen}
                        />

                        {previewImagen && (
                          <img
                            className="restaurante-image-preview"
                            src={previewImagen}
                            alt="Vista previa"
                          />
                        )}
                      </div>

                      <div className="col-md-7">
                        <label className="form-label">
                          Agregar productos del inventario
                        </label>

                        <div className="row g-2">
                          <div className="col-md-7">
                            <select
                              className="form-select"
                              value={productoSeleccionadoId}
                              onChange={(event) =>
                                setProductoSeleccionadoId(event.target.value)
                              }
                            >
                              <option value="">Selecciona producto</option>

                              {productos.map((producto) => (
                                <option key={producto.id} value={producto.id}>
                                  {producto.nombre} - stock {producto.stock_actual}{' '}
                                  {producto.unidad_medida}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-3">
                            <input
                              type="number"
                              className="form-control"
                              value={cantidadIngrediente}
                              onChange={(event) =>
                                setCantidadIngrediente(event.target.value)
                              }
                              min="0.01"
                              step="0.01"
                            />
                          </div>

                          <div className="col-md-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary w-100"
                              onClick={agregarIngrediente}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="restaurante-ingredient-list mt-3">
                          {ingredientes.map((ingrediente) => {
                            const producto =
                              productosPorId[
                              ingrediente.producto_inventario_id
                              ];

                            return (
                              <div
                                className="restaurante-ingredient-pill"
                                key={ingrediente.producto_inventario_id}
                              >
                                <span>
                                  {producto?.nombre || 'Producto'} -{' '}
                                  {ingrediente.cantidad_requerida}{' '}
                                  {producto?.unidad_medida || ''}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    eliminarIngrediente(
                                      ingrediente.producto_inventario_id,
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}

                          {ingredientes.length === 0 && (
                            <div className="alert alert-warning mb-0">
                              Agrega al menos un producto de inventario para este
                              plato.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer modal-plato-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cerrarModalPlato}
                      disabled={guardando}
                    >
                      Cancelar
                    </button>

                    <button className="btn btn-palmar" disabled={guardando}>
                      {guardando
                        ? 'Guardando...'
                        : platoEditar
                          ? 'Actualizar plato'
                          : 'Guardar plato'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default MenuManager;
