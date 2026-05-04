import React, { useEffect, useState } from 'react';

interface Producto {
  id_prod: string;
  nombre_prod: string;
  costo: number;
  precio_venta: number;
  stock_actual: number;
}

const App: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);

  console.log("🔹 window.electronAPI existe?", !!window.electronAPI);
  console.log("🔹 window.electronAPI.getProductos existe?", !!window.electronAPI?.getProductos);

  useEffect(() => {
    const fetchProductos = async () => {
      const data = await window.electronAPI.getProductos();
      console.log("Datos recibidos:", data)
      setProductos(data);
    };
    fetchProductos();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-blue-600">Mi App de Ventas 🚀</h1>
      <p className="mt-2">Electron + React + TypeScript + Tailwind + PostgreSQL</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Productos</h2>
        <table className="min-w-full mt-2 border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Costo (USD)</th>
              <th className="p-2 border">Precio Venta (USD)</th>
              <th className="p-2 border">Stock</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id_prod}>
                <td className="p-2 border">{p.id_prod}</td>
                <td className="p-2 border">{p.nombre_prod}</td>
                <td className="p-2 border">${Number(p.costo).toFixed(2)}</td>
                <td className="p-2 border">${Number(p.precio_venta).toFixed(2)}</td>
                <td className={`p-2 border ${p.stock_actual >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.stock_actual}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;