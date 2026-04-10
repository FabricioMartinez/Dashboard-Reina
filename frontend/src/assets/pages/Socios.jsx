import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Socios() {
  const [deudas, setDeudas] = useState([]);
  const [listaSocios, setListaSocios] = useState([]); // Nuevo estado para los nombres reales
  const [formData, setFormData] = useState({
    socio_id: '', // Lo arrancamos vacío y lo llenamos cuando lleguen los datos
    monto: ''
  });
  
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  // Unificamos las llamadas iniciales
  const obtenerDatosIniciales = async () => {
    try {
      // 1. Buscamos las deudas
      const resDeudas = await axios.get('http://localhost:3000/api/retiros/pendientes');
      setDeudas(resDeudas.data.deudas);

      // 2. Buscamos los nombres de los socios
      const resSocios = await axios.get('http://localhost:3000/api/socios');
      setListaSocios(resSocios.data.socios);
      
      // 3. Seleccionamos al primer socio (Sebastian) por defecto en el formulario
      if (resSocios.data.socios.length > 0) {
        setFormData(prev => ({ ...prev, socio_id: resSocios.data.socios[0].id }));
      }

    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  // Se ejecuta una sola vez al entrar a la página
  useEffect(() => {
    obtenerDatosIniciales();
  }, []);

  // Función para darle formato de plata automáticamente
  const formatearPlata = (numero) => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS' 
    }).format(numero);
  };

  const registrarRetiro = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      await axios.post('http://localhost:3000/api/retiros', {
        socio_id: Number(formData.socio_id),
        monto: Number(formData.monto)
      });
      
      setMensaje({ texto: '¡Retiro registrado exitosamente!', tipo: 'exito' });
      setFormData({ ...formData, monto: '' }); 
      
      // Solo actualizamos las deudas para ver el nuevo registro
      const resDeudas = await axios.get('http://localhost:3000/api/retiros/pendientes');
      setDeudas(resDeudas.data.deudas);

    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.error || 'Error al registrar el retiro', 
        tipo: 'error' 
      });
    } finally {
      setCargando(false);
    }
  };

  const marcarComoPagado = async (id) => {
    if (window.confirm('¿Confirmar que el socio ya devolvió este dinero a la caja?')) {
      try {
        await axios.put(`http://localhost:3000/api/retiros/${id}/pagado`);
        const resDeudas = await axios.get('http://localhost:3000/api/retiros/pendientes');
        setDeudas(resDeudas.data.deudas); 
      } catch (error) {
        console.error("Error al marcar como pagado:", error);
        alert("Hubo un error al actualizar la deuda");
      }
    }
  };

  // ... (Sigue tu código HTML del return)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#111', marginBottom: '20px' }}>Caja Chica - Socios 👥</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        
        <div style={tarjetaStyle}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>Registrar Salida</h2>
          
          <form onSubmit={registrarRetiro} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <div>
              <label style={labelStyle}>Socio que retira</label>
              <select 
                value={formData.socio_id} 
                onChange={(e) => setFormData({...formData, socio_id: e.target.value})}
                style={inputStyle}
              >
                {listaSocios.map((socio) => (
                  <option key={socio.id} value={socio.id}>
                    {socio.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Monto a retirar ($)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ej: 15000"
                value={formData.monto}
                onChange={(e) => setFormData({...formData, monto: e.target.value})}
                style={{...inputStyle, fontWeight: 'bold'}}
              />
            </div>

            <button type="submit" disabled={cargando} style={botonStyle}>
              {cargando ? 'Registrando...' : 'Confirmar Retiro 💸'}
            </button>
          </form>

          {mensaje.texto && (
            <div style={{ 
              marginTop: '15px', padding: '10px', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px',
              backgroundColor: mensaje.tipo === 'error' ? '#ffebee' : '#e8f5e9',
              color: mensaje.tipo === 'error' ? '#c62828' : '#2e7d32'
            }}>
              {mensaje.texto}
            </div>
          )}
        </div>

        <div style={tarjetaStyle}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>Deudas Pendientes</h2>
          
          {deudas.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>Nadie debe plata. ¡Caja impecable! ✨</p>
          ) : (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deudas.map((deuda) => (
                <div key={deuda.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #c62828' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#111' }}>
                      {deuda.socio ? deuda.socio.nombre : `Socio #${deuda.socio_id}`}
                    </strong>
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      Fecha: {new Date(deuda.fecha).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  
                  {/* --- ACÁ AGREGAMOS EL BOTÓN AL LADO DEL PRECIO --- */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#c62828' }}>
                      {formatearPlata(deuda.monto)}
                    </span>
                    <button 
                      onClick={() => marcarComoPagado(deuda.id)}
                      style={{
                        backgroundColor: '#2e7d32', color: 'white', border: 'none', 
                        padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', 
                        fontWeight: 'bold', fontSize: '13px'
                      }}
                    >
                      Ya Pagó ✔️
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- ESTILOS VISUALES ---
const tarjetaStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: 'fit-content' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none' };
const botonStyle = { width: '100%', padding: '15px', fontSize: '16px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };