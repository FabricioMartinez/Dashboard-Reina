import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [ventas, setVentas] = useState([]); // Nuevo estado para la tabla
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        // 1. Pedimos los números grandes para las tarjetas
        const resStats = await axios.get('http://localhost:3000/api/dashboard');
        setEstadisticas(resStats.data.estadisticas);

        // 2. Pedimos la lista de las últimas ventas para la tabla
        const resVentas = await axios.get('http://localhost:3000/api/ventas/ultimas');
        setVentas(resVentas.data.ventas);

        setCargando(false);
      } catch (error) {
        console.error("Error al conectar con el backend:", error);
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []);

  // Funciones para dar formato visual
  const formatearPlata = (numero) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numero);
  };

  const formatearFecha = (fecha) => {
    // Formatea la fecha de la base de datos a formato argentino (DD/MM/AAAA, HH:MM)
    return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  };

  // Asignamos colores según el tipo de venta
  const getColorPlataforma = (tipo) => {
    if (tipo === 'TikTok') return { bg: '#111', text: 'white' }; // Negro TikTok
    if (tipo === 'Local') return { bg: '#e8f5e9', text: '#2e7d32' }; // Verde Local
    return { bg: '#e3f2fd', text: '#1565c0' }; // Azul Docena
  };

  if (cargando) {
    return <h2 style={{ color: '#666' }}>Cargando resumen de caja... ⏳</h2>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#111' }}>Resumen de La Reina 👑</h1>

      {/* --- SECCIÓN 1: TARJETAS SUPERIORES --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={tarjetaStyle}>
          <h3 style={tituloTarjetaStyle}>Ventas de Hoy</h3>
          <p style={numeroStyle}>{formatearPlata(estadisticas?.ventas_hoy_efectivo || 0)}</p>
        </div>
        <div style={tarjetaStyle}>
          <h3 style={tituloTarjetaStyle}>Stock Total</h3>
          <p style={numeroStyle}>{estadisticas?.stock_total_prendas || 0} prendas</p>
        </div>
        <div style={tarjetaStyle}>
          <h3 style={tituloTarjetaStyle}>Saldo de Caja Real</h3>
          <p style={{...numeroStyle, color: (estadisticas?.saldo_caja >= 0) ? '#2e7d32' : '#c62828' }}>
            {formatearPlata(estadisticas?.saldo_caja || 0)}
          </p>
        </div>
        <div style={tarjetaStyle}>
          <h3 style={tituloTarjetaStyle}>Inversión en Compras</h3>
          <p style={numeroStyle}>{formatearPlata(estadisticas?.inversion_total_compras || 0)}</p>
        </div>
      </div>

      {/* --- SECCIÓN 2: TABLA DE ÚLTIMAS VENTAS --- */}
      <div style={tarjetaStyle}>
        <h2 style={{ fontSize: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px', marginTop: 0, color: '#111' }}>
          Últimos Tickets Facturados 🧾
        </h2>

        {ventas.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', marginTop: '30px', marginBottom: '30px' }}>
            Todavía no hay ventas registradas en el sistema.
          </p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={thStyle}>ID TICKET</th>
                  <th style={thStyle}>FECHA Y HORA</th>
                  <th style={thStyle}>CANAL DE VENTA</th>
                  <th style={{...thStyle, textAlign: 'right'}}>TOTAL COBRADO</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => {
                  const colores = getColorPlataforma(venta.tipo_venta);
                  return (
                    <tr key={venta.id} style={{ borderBottom: '1px solid #f5f5f5', transition: '0.2s' }}>
                      <td style={tdStyle}><b>#{venta.id}</b></td>
                      <td style={{...tdStyle, color: '#666'}}>{formatearFecha(venta.createdAt || venta.fecha)}</td>
                      <td style={tdStyle}>
                        <span style={{ 
                          backgroundColor: colores.bg, color: colores.text, 
                          padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' 
                        }}>
                          {venta.tipo_venta}
                        </span>
                      </td>
                      <td style={{...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#111', fontSize: '16px'}}>
                        {formatearPlata(venta.total_recaudado)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// --- ESTILOS VISUALES ---
const tarjetaStyle = {
  backgroundColor: 'white',
  padding: '25px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const tituloTarjetaStyle = { margin: 0, color: '#666', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' };
const numeroStyle = { margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#111' };
const thStyle = { padding: '15px 10px', color: '#888', fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold' };
const tdStyle = { padding: '15px 10px', fontSize: '15px', color: '#333' };