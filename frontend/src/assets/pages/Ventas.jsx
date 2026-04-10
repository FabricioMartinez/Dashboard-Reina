import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function Ventas() {
  // Estados para manejar la información
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [producto, setProducto] = useState(null);
  const [tipoVenta, setTipoVenta] = useState('Local');
  const [cantidad, setCantidad] = useState(1);
  const [precioFinal, setPrecioFinal] = useState(0); // El precio que podés editar a mano
  
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  // Referencia para que el input del escáner siempre esté seleccionado
  const inputEscanerRef = useRef(null);

  // Cada vez que cambias entre "Local", "TikTok" o "Docena", recalculamos el precio sugerido
  useEffect(() => {
    if (producto) {
      calcularPrecioSugerido(producto.precio_compra, tipoVenta);
    }
  }, [tipoVenta, producto]);

  const calcularPrecioSugerido = (costo, tipo) => {
    let porcentaje = 0;
    if (tipo === 'Local') porcentaje = 0.50;
    if (tipo === 'TikTok') porcentaje = 0.35;
    if (tipo === 'Docena') porcentaje = 0.20;

    const calculo = Number(costo) + (Number(costo) * porcentaje);
    setPrecioFinal(calculo); // Setemos el precio base, pero luego podés borrarlo y escribir otro
  };

  // Función 1: El escáner lee el código y aprieta "Enter" (o vos le das al botón Buscar)
  const buscarProducto = async (e) => {
    e.preventDefault(); // Evita que la página recargue
    if (!codigoBusqueda) return;
    
    setCargando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const respuesta = await axios.get(`http://localhost:3000/api/productos/${codigoBusqueda}`);
      setProducto(respuesta.data.producto);
      setCantidad(1); // Reiniciamos la cantidad a 1
      setCodigoBusqueda(''); // Limpiamos el input para el próximo escaneo
    } catch (error) {
      setProducto(null);
      setMensaje({ 
        texto: error.response?.data?.error || 'Producto no encontrado', 
        tipo: 'error' 
      });
    } finally {
      setCargando(false);
    }
  };

  // Función 2: Confirmar la venta y mandarla al Backend
  const confirmarVenta = async () => {
    if (!producto) return;
    setCargando(true);

    try {
      // Armamos el "ticket" como lo pide tu backend
      const payload = {
        tipo_venta: tipoVenta,
        // Agregamos el precio_manual por si lo editaste en la pantalla
        detalles: [{
          producto_id: producto.id,
          cantidad: Number(cantidad),
          precio_manual_cobrado: Number(precioFinal) 
        }]
      };

      await axios.post('http://localhost:3000/api/ventas', payload);
      
      setMensaje({ texto: `¡Venta registrada con éxito! Stock actualizado.`, tipo: 'exito' });
      
      // Limpiamos la pantalla para el siguiente cliente
      setProducto(null);
      setTimeout(() => inputEscanerRef.current?.focus(), 100); // Volvemos a poner el cursor en el escáner

    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.error || 'Error al registrar la venta', 
        tipo: 'error' 
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#111', marginBottom: '20px' }}>Punto de Venta 🛒</h1>

      {/* --- SECCIÓN 1: EL ESCÁNER --- */}
      <div style={tarjetaStyle}>
        <form onSubmit={buscarProducto} style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={inputEscanerRef}
            autoFocus // Esto hace que al entrar a la página, ya puedas gatillar la pistola
            type="text"
            placeholder="Escaneá el código de barras o escribilo y dale Enter..."
            value={codigoBusqueda}
            onChange={(e) => setCodigoBusqueda(e.target.value)}
            style={inputPrincipalStyle}
          />
          <button type="submit" disabled={cargando} style={botonBuscarStyle}>
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Mensajes de Alerta */}
        {mensaje.texto && (
          <div style={{ 
            marginTop: '15px', padding: '10px', borderRadius: '5px',
            backgroundColor: mensaje.tipo === 'error' ? '#ffebee' : '#e8f5e9',
            color: mensaje.tipo === 'error' ? '#c62828' : '#2e7d32'
          }}>
            {mensaje.texto}
          </div>
        )}
      </div>

      {/* --- SECCIÓN 2: DETALLE DEL PRODUCTO (Solo se muestra si hay algo escaneado) --- */}
      {producto && (
        <div style={{ ...tarjetaStyle, marginTop: '20px', borderLeft: '5px solid #111' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>{producto.descripcion}</h2>
              <span style={{ color: '#666', fontSize: '14px' }}>Código: {producto.codigo_boleta} | Stock actual: <b>{producto.stock_actual}</b></span>
            </div>
            {producto.stock_actual <= 0 && (
              <span style={{ backgroundColor: '#c62828', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '14px' }}>Sin Stock</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* Selector de Tipo de Venta */}
            <div>
              <label style={labelStyle}>Plataforma de Venta</label>
              <select 
                value={tipoVenta} 
                onChange={(e) => setTipoVenta(e.target.value)}
                style={inputChicoStyle}
              >
                <option value="Local">Local (50%)</option>
                <option value="TikTok">TikTok (35%)</option>
                <option value="Docena">Por Docena (20%)</option>
              </select>
            </div>

            {/* Input de Cantidad */}
            <div>
              <label style={labelStyle}>Cantidad</label>
              <input 
                type="number" 
                min="1" 
                max={producto.stock_actual}
                value={cantidad} 
                onChange={(e) => setCantidad(e.target.value)}
                style={inputChicoStyle}
              />
            </div>

            {/* Input de Precio Final (Editable) */}
            <div>
              <label style={labelStyle}>Precio a Cobrar (c/u)</label>
              <input 
                type="number" 
                value={precioFinal} 
                onChange={(e) => setPrecioFinal(e.target.value)} // ¡Acá permitimos que vos cambies el número a mano!
                style={{...inputChicoStyle, fontWeight: 'bold', color: '#2e7d32'}}
              />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <span style={{ fontSize: '18px', color: '#666' }}>
              Total Ticket: <b style={{ color: '#111', fontSize: '24px' }}>${(precioFinal * cantidad).toLocaleString('es-AR')}</b>
            </span>
            <button 
              onClick={confirmarVenta} 
              disabled={cargando || producto.stock_actual < cantidad}
              style={{...botonBuscarStyle, backgroundColor: '#111', width: 'auto'}}
            >
              Confirmar Venta ✅
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// --- ESTILOS ---
const tarjetaStyle = {
  backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
};
const inputPrincipalStyle = {
  flex: 1, padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none'
};
const botonBuscarStyle = {
  padding: '15px 25px', fontSize: '16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
};
const labelStyle = {
  display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666', fontWeight: 'bold'
};
const inputChicoStyle = {
  width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'
};