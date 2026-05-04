import React, { useEffect, useState } from 'react';
import ProductoModal from './components/ProductoModal';
import { Producto } from '../shared/entities/Producto';

const App: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Partial<Producto> | null>(null);

  const fetchProductos = async () => {
    const data = await window.electronAPI.getProductos();
    setProductos(data);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleCreate = async (producto: Partial<Producto>) => {
    await window.electronAPI.createProducto(producto);
    fetchProductos();
  };

  const handleUpdate = async (id: string, producto: Partial<Producto>) => {
    await window.electronAPI.updateProducto(id, producto);
    fetchProductos();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await window.electronAPI.deleteProducto(id);
      fetchProductos();
    }
  };

  const openEditModal = (producto: Producto) => {
    setProductoEditar(producto);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-blue-600">Mi App de Ventas 🚀</h1>
      <p className="mt-2">Electron + React + TypeScript + Tailwind + PostgreSQL</p>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Productos</h2>
          <button
            onClick={() => {
              setProductoEditar(null);
              setIsModalOpen(true);
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
              <th className="p-2 border">Precio Venta (USD)</th>
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
                <td className="p-2 border">${Number(p.precio_venta).toFixed(2)}</td>
                <td className={`p-2 border ${p.stock_actual >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.stock_actual}
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id_prod)}
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
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(producto) => {
            if (productoEditar) {
              handleUpdate(productoEditar.id_prod!, producto);
            } else {
              handleCreate(producto);
            }
          }}
          productoEditar={productoEditar}
        />
      </div>
    </div>
  );
};

export default App;