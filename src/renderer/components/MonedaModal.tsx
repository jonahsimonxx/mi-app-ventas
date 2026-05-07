import React, { useState, useEffect } from 'react';
import { Moneda } from '../../shared/entities/Moneda';

interface MonedaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moneda: Partial<Moneda>) => void;
  monedaEditar: Partial<Moneda> | null;
}

const MonedaModal: React.FC<MonedaModalProps> = ({ isOpen, onClose, onSave, monedaEditar }) => {
  const [moneda, setMoneda] = useState<Partial<Moneda>>({
    codigo: '',
    nombre: '',
  });

  useEffect(() => {
    if (monedaEditar) {
      setMoneda(monedaEditar);
    } else {
      setMoneda({ codigo: '', nombre: '' });
    }
  }, [monedaEditar, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(moneda);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          {monedaEditar ? 'Editar Moneda' : 'Nueva Moneda'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Código:</label>
            <select
              value={moneda.codigo}
              onChange={(e) => setMoneda({ ...moneda, codigo: e.target.value })}
              className="w-full p-2 border rounded"
              required
              disabled={!!monedaEditar}
            >
              <option value="">Selecciona un código</option>
              <option value="USD">USD</option>
              <option value="CUP">CUP</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nombre:</label>
            <select
              value={moneda.nombre}
              onChange={(e) => setMoneda({ ...moneda, nombre: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Selecciona un nombre</option>
              <option value="Dólar Estadounidense">Dólar Estadounidense</option>
              <option value="Peso Cubano">Peso Cubano</option>
              <option value="Tether">Tether</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              {monedaEditar ? 'Guardar Cambios' : 'Crear Moneda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonedaModal;