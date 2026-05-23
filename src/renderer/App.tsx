import React, { useEffect, useState } from 'react';
import ProductoModal from './components/ProductoModal';
import MonedaModal from './components/MonedaModal';
import { Producto } from '../shared/entities/Producto';
import { Moneda } from '../shared/entities/Moneda';

const App: React.FC = () => {
  // ========== ESTADO PARA PRODUCTOS ==========
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Partial<Producto> | null>(null);

  // ========== ESTADO PARA MONEDAS ==========
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [isMonedaModalOpen, setIsMonedaModalOpen] = useState(false);
  const [monedaEditar, setMonedaEditar] = useState<Partial<Moneda> | null>(null);

  // ========== PESTAÑA ACTIVA ==========
  const [activeTab, setActiveTab] = useState<'productos' | 'monedas'>('productos');

  // ========== FUNCIONES PARA PRODUCTOS ==========
  const fetchProductos = async () => {
    const data = await window.electronAPI.getProductos();
    setProductos(data);
  };

  const handleCreateProducto = async (producto: Partial<Producto>) => {
    await window.electronAPI.createProducto(producto);
    fetchProductos();
  };

  const handleUpdateProducto = async (id: string, producto: Partial<Producto>) => {
    await window.electronAPI.updateProducto(id, producto);
    fetchProductos();
    setIsProductoModalOpen(false);
  };

  const handleDeleteProducto = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await window.electronAPI.deleteProducto(id);
      fetchProductos();
    }
  };

  const openEditProductoModal = (producto: Producto) => {
    setProductoEditar(producto);
    setIsProductoModalOpen(true);
  };

  // ========== FUNCIONES PARA MONEDAS ==========
  const fetchMonedas = async () => {
    const data = await window.electronAPI.getMonedas();
    setMonedas(data);
  };

  const handleCreateMoneda = async (moneda: Partial<Moneda>) => {
    await window.electronAPI.createMoneda(moneda);
    fetchMonedas();
  };

  const handleUpdateMoneda = async (codigo: string, moneda: Partial<Moneda>) => {
    await window.electronAPI.updateMoneda(codigo, moneda);
    fetchMonedas();
    setIsMonedaModalOpen(false);
  };

  const handleDeleteMoneda = async (codigo: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta moneda?')) {
      await window.electronAPI.deleteMoneda(codigo);
      fetchMonedas();
    }
  };

  const openEditMonedaModal = (moneda: Moneda) => {
    setMonedaEditar(moneda);
    setIsMonedaModalOpen(true);
  };

  const [refreshingTasas, setRefreshingTasas] = useState(false);

  const handleRefreshTasas = async () => {
    try {
      setRefreshingTasas(true);
      const res = await window.electronAPI.refreshTasas();
      await fetchMonedas();
      if (res.source === 'eltoque') {
        const partes = [
          res.USD ? `USD = ${res.USD} CUP` : null,
          res.USDT ? `USDT = ${res.USDT} CUP` : null,
        ].filter(Boolean).join(' · ');
        window.alert(`✅ Tasas actualizadas desde El Toque${res.fecha ? ` (${res.fecha})` : ''}\n${partes}`);
      } else if (res.source === 'omfi') {
        window.alert(`⚠️ El Toque no respondió. Tasa USD obtenida desde OMFi: ${res.USD} CUP`);
      } else {
        window.alert('❌ No se pudieron obtener tasas. Revisa tu conexión y el token.');
      }
    } catch (e) {
      console.error(e);
      window.alert('❌ Error al actualizar tasas.');
    } finally {
      setRefreshingTasas(false);
    }
  };

  // ========== CARGAR DATOS AL CAMBIAR DE PESTAÑA ==========
  useEffect(() => {
    if (activeTab === 'productos') {
      fetchProductos();
    } else {
      fetchMonedas();
    }
  }, [activeTab]);

  // ========== OBTENER TASA DE CAMBIO USD ==========
  const tasaUSD = monedas.find(m => m.codigo === 'USD')?.tasa_cambio || 1;

  // ========== RENDERIZADO ==========
  return (
    <div className="p-4">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-blue-600">Mi App de Ventas 🚀</h1>
      <p className="mt-2">Electron + React + TypeScript + Tailwind + PostgreSQL</p>

      {/* Pestañas */}
      <div className="mt-6 flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('productos')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'productos'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab('monedas')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'monedas'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Monedas
        </button>
      </div>

      {/* Contenido según pestaña */}
      <div className="mt-4">
        {/* ========== PESTAÑA PRODUCTOS ========== */}
        {activeTab === 'productos' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Productos</h2>
              <button
                onClick={() => {
                  setProductoEditar(null);
                  setIsProductoModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Nuevo Producto
              </button>
            </div>

            <table className="min-w-full mt-2 border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Descripción</th>
                  <th className="p-2 border">Costo (USD)</th>
                  <th className="p-2 border">Precio Venta (USD/CUP)</th>
                  <th className="p-2 border">Stock</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id_prod}>
                    <td className="p-2 border">{p.id_prod}</td>
                    <td className="p-2 border">{p.nombre_prod}</td>
                    <td className="p-2 border">{p.descripcion || 'N/A'}</td>
                    <td className="p-2 border">${Number(p.costo).toFixed(2)}</td>
                    <td className="p-2 border">
                      ${Number(p.precio_venta).toFixed(2)} / <br />
                      <span className="text-green-600 font-medium">
                        {Number(p.precio_venta * tasaUSD).toFixed(2)} CUP
                      </span>
                    </td>
                    <td className={`p-2 border ${
                      p.stock_actual >= 5 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {p.stock_actual}
                    </td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => openEditProductoModal(p)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProducto(p.id_prod)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ProductoModal
              isOpen={isProductoModalOpen}
              onClose={() => setIsProductoModalOpen(false)}
              onSave={(producto) => {
                if (productoEditar) {
                  handleUpdateProducto(productoEditar.id_prod!, producto);
                } else {
                  handleCreateProducto(producto);
                }
              }}
              productoEditar={productoEditar}
            />
          </>
        )}

        {/* ========== PESTAÑA MONEDAS ========== */}
        {activeTab === 'monedas' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Monedas</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleRefreshTasas}
                  disabled={refreshingTasas}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  title="Actualiza USD y USDT desde la API de El Toque"
                >
                  {refreshingTasas ? 'Actualizando…' : '↻ Actualizar tasas (El Toque)'}
                </button>
                <button
                  onClick={() => {
                    setMonedaEditar(null);
                    setIsMonedaModalOpen(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Nueva Moneda
                </button>
              </div>
            </div>

            <table className="min-w-full mt-2 border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Código</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Tasa de Cambio (vs CUP)</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {monedas.map((m) => (
                  <tr key={m.codigo}>
                    <td className="p-2 border">{m.codigo}</td>
                    <td className="p-2 border">{m.nombre}</td>
                    <td className="p-2 border">{Number(m.tasa_cambio).toFixed(2)}</td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => openEditMonedaModal(m)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteMoneda(m.codigo)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <MonedaModal
              isOpen={isMonedaModalOpen}
              onClose={() => setIsMonedaModalOpen(false)}
              onSave={(moneda) => {
                if (monedaEditar) {
                  handleUpdateMoneda(monedaEditar.codigo!, moneda);
                } else {
                  handleCreateMoneda(moneda);
                }
              }}
              monedaEditar={monedaEditar}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;