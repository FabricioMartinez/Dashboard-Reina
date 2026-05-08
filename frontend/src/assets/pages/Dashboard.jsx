import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [ventas, setVentas] = useState([]); // Nuevo estado para la tabla
  const [cargando, setCargando] = useState(true);

  // --- NUEVOS ESTADOS PARA EL FILTRO ---
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [resultadoFiltro, setResultadoFiltro] = useState(null);
  const [proveedorBuscado, setProveedorBuscado] = useState('');

  // --- FUNCIÓN PARA BUSCAR ---
const filtrarVentas = async () => {
    if (!fechaDesde || !fechaHasta) return alert("Por favor seleccioná ambas fechas");
    try {
      // Le sumamos el proveedor a la URL
      const res = await axios.get(`http://localhost:3000/api/finanzas/filtro?inicio=${fechaDesde}&fin=${fechaHasta}&proveedor=${proveedorBuscado}`);
      setResultadoFiltro(res.data);
    } catch (error) {
      alert("Error al buscar el balance");
    }
  };
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
  const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' };
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

{/* --- SECCIÓN 1: PANEL PRINCIPAL --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        <div style={{...tarjetaStyle, borderLeft: '4px solid #111'}}>
          <h3 style={tituloTarjetaStyle}>Ventas de Hoy</h3>
          <p style={numeroStyle}>{formatearPlata(estadisticas?.ventas_hoy || 0)}</p>
        </div>

        <div style={{...tarjetaStyle, borderLeft: '4px solid #1976d2'}}>
          <h3 style={tituloTarjetaStyle}>Stock Total</h3>
          <p style={numeroStyle}>{estadisticas?.stock_total_prendas || 0} prendas</p>
        </div>

        <div style={{...tarjetaStyle, borderLeft: '4px solid #f57c00'}}>
          <h3 style={tituloTarjetaStyle}>Inversión en Compras</h3>
          <p style={numeroStyle}>{formatearPlata(estadisticas?.inversion_total_compras || 0)}</p>
        </div>

        <div style={{...tarjetaStyle, borderLeft: '4px solid #2e7d32', backgroundColor: (estadisticas?.ganancia_hoy >= 0) ? '#f1f8e9' : '#ffebee'}}>
          <h3 style={tituloTarjetaStyle}>Ganancia de Hoy</h3>
          <p style={{...numeroStyle, color: (estadisticas?.ganancia_hoy >= 0) ? '#2e7d32' : '#c62828' }}>
            {formatearPlata(estadisticas?.ganancia_hoy || 0)}
          </p>
        </div>

      </div>

      {/* --- SECCIÓN NUEVA: BUSCADOR POR FECHAS --- */}
      <div style={{...tarjetaStyle, marginBottom: '40px', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0'}}>
        <h2 style={{ fontSize: '18px', color: '#111', marginTop: 0, marginBottom: '15px' }}>
          🔍 Buscar Ventas Históricas
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
<div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Desde:</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Hasta:</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={inputStyle} />
          </div>
          
          {/* --- ACÁ ESTÁ EL CAMPO NUEVO --- */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Proveedor (Opcional):</label>
            <input 
              type="text" 
              placeholder="Ej: Flores" 
              value={proveedorBuscado} 
              onChange={e => setProveedorBuscado(e.target.value)} 
              style={{...inputStyle, width: '150px'}} 
            />
          </div>
          {/* --------------------------------- */}

          <button onClick={filtrarVentas} style={{ padding: '10px 20px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '39px' }}>
            Calcular Periodo
          </button>
        </div>
        </div>

        {/* --- RESULTADO DE LA BÚSQUEDA --- */}
{/* --- RESULTADO DE LA BÚSQUEDA --- */}
        {resultadoFiltro && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #2e7d32' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2e7d32', fontSize: '16px' }}>
              Balance del {formatearFecha(fechaDesde + 'T12:00:00')} al {formatearFecha(fechaHasta + 'T12:00:00')}:
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 'bold' }}>INGRESOS (Ventas)</p>
                <p style={{ margin: 0, fontSize: '20px', color: '#111', fontWeight: 'bold' }}>{formatearPlata(resultadoFiltro.totalVentas)}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>De {resultadoFiltro.ventas.length} tickets</p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #ffcdd2' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 'bold' }}>EGRESOS (Mercadería)</p>
                <p style={{ margin: 0, fontSize: '20px', color: '#c62828', fontWeight: 'bold' }}>- {formatearPlata(resultadoFiltro.totalCompras)}</p>
              </div>

              <div style={{ backgroundColor: '#111', padding: '10px', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>GANANCIA NETA</p>
                <p style={{ margin: 0, fontSize: '20px', color: (resultadoFiltro.gananciaNeta >= 0 ? '#4caf50' : '#f44336'), fontWeight: 'bold' }}>
                  {formatearPlata(resultadoFiltro.gananciaNeta)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SECCIÓN 3: TABLA DE ÚLTIMAS VENTAS --- */}
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