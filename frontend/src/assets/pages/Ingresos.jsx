import { useState, useRef } from 'react';
import axios from 'axios';

export default function Ingresos() {
  // Agregamos stock_actual al estado inicial
  const [formData, setFormData] = useState({ codigo_boleta: '', descripcion: '', precio_compra: '', stock_actual: '0' });
  const [imagen, setImagen] = useState(null); 
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);
  
  const inputCodigoRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImagen(e.target.files[0]);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ texto: '', tipo: '' });

    const datosEnvio = new FormData();
    datosEnvio.append('codigo_boleta', formData.codigo_boleta);
    datosEnvio.append('descripcion', formData.descripcion);
    datosEnvio.append('precio_compra', formData.precio_compra);
    datosEnvio.append('stock_actual', formData.stock_actual); // Mandamos el stock
    if (imagen) {
      datosEnvio.append('imagen', imagen); 
    }

    try {
      await axios.post('http://localhost:3000/api/productos', datosEnvio, {
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      setMensaje({ texto: '¡Prenda guardada con foto y stock!', tipo: 'exito' });
      setFormData({ codigo_boleta: '', descripcion: '', precio_compra: '', stock_actual: '0' });
      setImagen(null);
      document.getElementById('inputFoto').value = ''; 
      setTimeout(() => inputCodigoRef.current?.focus(), 100);

    } catch (error) {
      setMensaje({ texto: 'Hubo un error al guardar', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#111', marginBottom: '20px' }}>Ingresar Ropa Nueva 📦</h1>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Código de Barra</label>
            <input ref={inputCodigoRef} type="text" name="codigo_boleta" required value={formData.codigo_boleta} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descripción de la prenda</label>
            <input type="text" name="descripcion" required value={formData.descripcion} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Precio de Costo</label>
              <input type="number" name="precio_compra" required value={formData.precio_compra} onChange={handleChange} style={{ ...inputStyle, fontWeight: 'bold' }} />
            </div>
            {/* NUEVO INPUT DE STOCK INICIAL */}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Stock Inicial</label>
              <input type="number" name="stock_actual" min="0" required value={formData.stock_actual} onChange={handleChange} style={{ ...inputStyle, fontWeight: 'bold', color: '#2e7d32' }} />
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>Subir Foto de la Prenda (Opcional)</label>
            <input id="inputFoto" type="file" accept="image/*" onChange={handleFileChange} style={inputStyle} />
          </div>

          <button type="submit" disabled={cargando} style={botonStyle}>
            {cargando ? 'Guardando...' : 'Guardar en Catálogo ➕'}
          </button>
        </form>

        {mensaje.texto && (
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: mensaje.tipo === 'error' ? '#ffebee' : '#e8f5e9', color: mensaje.tipo === 'error' ? '#c62828' : '#2e7d32' }}>
            {mensaje.texto}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' };
const botonStyle = { width: '100%', padding: '15px', fontSize: '16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };