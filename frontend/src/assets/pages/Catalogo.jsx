import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState(null); // Estado para saber qué prenda editamos

  const IMG_DEFAULT = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80";

  const obtenerCatalogo = async (termino = '') => {
    setCargando(true);
    try {
      const respuesta = await axios.get(`http://localhost:3000/api/productos?buscar=${termino}`);
      setProductos(respuesta.data.productos);
    } catch (error) {
      console.error("Error al cargar el catálogo:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { obtenerCatalogo(); }, []);

  const manejarBusqueda = (e) => {
    e.preventDefault();
    obtenerCatalogo(busqueda);
  };

  const obtenerImagen = (rutaLocal) => {
    if (!rutaLocal) return IMG_DEFAULT;
    return `http://localhost:3000${rutaLocal}`;
  };

  // --- FUNCIONES NUEVAS: ELIMINAR Y EDITAR ---
  const eliminarProducto = async (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de que querés borrar esta prenda del sistema?")) {
      try {
        await axios.delete(`http://localhost:3000/api/productos/${id}`);
        obtenerCatalogo(busqueda); // Recarga la lista
      } catch (error) {
        alert("No se pudo borrar. Quizás ya tiene ventas asociadas.");
      }
    }
  };

  const guardarEdicion = async () => {
    try {
      await axios.put(`http://localhost:3000/api/productos/${editando.id}`, {
        descripcion: editando.descripcion,
        precio_compra: editando.precio_compra,
        stock_actual: editando.stock_actual
      });
      setEditando(null); // Cierra la ventana
      obtenerCatalogo(busqueda); // Recarga
    } catch (error) {
      alert("Error al actualizar la prenda.");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <h1 style={{ color: '#111', marginBottom: '20px' }}>Catálogo de La Reina 👑</h1>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <form onSubmit={manejarBusqueda} style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="🔎 Buscar prenda por nombre o código de barras..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, padding: '15px', fontSize: '18px', borderRadius: '8px', border: '2px solid #111', outline: 'none' }}
          />
          <button type="submit" style={botonStyle}>{cargando ? '...' : 'Buscar'}</button>
          <button type="button" onClick={() => { setBusqueda(''); obtenerCatalogo(''); }} style={{...botonStyle, backgroundColor: '#666'}}>Limpiar</button>
        </form>
      </div>

      {productos.length === 0 ? (
        <h2 style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>No hay prendas con ese nombre.</h2>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
          {productos.map((prod) => (
            <div key={prod.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
              
              <div style={{ width: '100%', height: '250px', backgroundColor: '#eee' }}>
                <img src={obtenerImagen(prod.imagen_url)} alt={prod.descripcion} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = IMG_DEFAULT }} />
              </div>

              <div style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>CÓDIGO: {prod.codigo_boleta}</span>
                <h3 style={{ margin: '5px 0', fontSize: '18px', color: '#111' }}>{prod.descripcion}</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <strong style={{ fontSize: '16px', color: '#2e7d32' }}>${prod.precio_compra} Costo</strong>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>Stock</span>
                    <strong style={{ fontSize: '18px', color: prod.stock_actual <= 3 ? '#c62828' : '#111' }}>{prod.stock_actual}</strong>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={() => setEditando(prod)} style={{ flex: 1, padding: '10px', backgroundColor: '#e0e0e0', color: '#111', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Editar</button>
                  <button onClick={() => eliminarProducto(prod.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL PARA EDITAR (Ventana Flotante) --- */}
      {editando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0 }}>Editar Prenda</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>Código: {editando.codigo_boleta}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Descripción</label>
                <input type="text" value={editando.descripcion} onChange={(e) => setEditando({...editando, descripcion: e.target.value})} style={inputModalStyle} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Costo ($)</label>
                  <input type="number" value={editando.precio_compra} onChange={(e) => setEditando({...editando, precio_compra: e.target.value})} style={inputModalStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Stock</label>
                  <input type="number" value={editando.stock_actual} onChange={(e) => setEditando({...editando, stock_actual: e.target.value})} style={inputModalStyle} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button onClick={guardarEdicion} style={{ flex: 1, padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
              <button onClick={() => setEditando(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const botonStyle = { padding: '15px 25px', fontSize: '16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const inputModalStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px', boxSizing: 'border-box' };