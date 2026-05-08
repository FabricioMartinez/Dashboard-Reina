import { useState } from 'react';
import axios from 'axios';

export default function Vender() {
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [plataforma, setPlataforma] = useState('Local');
  const [estado, setEstado] = useState('');

  const buscarProducto = async (e) => {
    e.preventDefault();
    if (!busqueda) return;
    try {
      const res = await axios.get(`http://localhost:3000/api/productos/${busqueda}`);
      
      // 1. EL TRUCO: Desenvolver el producto venga como venga
      let producto = res.data;
      if (Array.isArray(res.data)) {
        producto = res.data[0]; // Si el backend manda una lista [ {producto} ]
      } else if (res.data.producto) {
        producto = res.data.producto; // Si el backend manda { producto: {...} }
      }

      // Si después de buscar no hay nada, cortamos acá
      if (!producto || !producto.descripcion) {
        alert("Producto no encontrado o código incorrecto");
        return;
      }

      // 2. Asegurarnos de que el precio sea un número y aplicar el redondeo a miles
// 2. Cálculo con MARGEN DE GANANCIA REAL (Precio = Costo / (1 - margen))
      const precioBase = Number(producto.precio_compra) || 0; 
      
      // Definimos el margen: 33% para Local (0.33) y 25% para TikTok (0.25)
      const margen = plataforma === 'Local' ? 0.33 : 0.25;
      
      // Aplicamos tu fórmula: Costo / (1 - 0.33) que es lo mismo que Costo / 0.67
      const precioBruto = precioBase / (1 - margen);
      
      // Redondeo a miles (ej: 14925 -> 15000)
      const precioSugerido = Math.round(precioBruto / 1000) * 1000;

      // 3. Verificamos si ya está en el carrito para sumar cantidad
      const existe = carrito.find(item => item.id === producto.id);
      if (existe) {
        setCarrito(carrito.map(item => 
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        ));
      } else {
        setCarrito([...carrito, { ...producto, cantidad: 1, precioVenta: precioSugerido }]);
      }
      
      setBusqueda(''); // Limpiamos buscador para el próximo escaneo
    } catch (error) {
      alert("Error al conectar con la base de datos");
    }
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const totalTicket = Math.round(carrito.reduce((acc, item) => acc + (item.precioVenta * item.cantidad), 0));

  const confirmarVenta = async () => {
    if (carrito.length === 0) return;
    setEstado('procesando');
    try {
      await axios.post('http://localhost:3000/api/ventas/multiproducto', {
        productos: carrito,
        tipo_venta: plataforma,
        total_recaudado: totalTicket
      });
      setCarrito([]);
      setEstado('exito');
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      alert("Error al procesar la venta");
      setEstado('');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#111' }}>Punto de Venta 🛒</h1>

      {/* --- BUSCADOR --- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <form onSubmit={buscarProducto} style={{ display: 'flex', gap: '10px' }}>
          <input 
            autoFocus
            type="text" 
            placeholder="Escaneá código o escribí..." 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px 25px', backgroundColor: '#111', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Añadir
          </button>
        </form>
      </div>

      {/* --- CARRITO --- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Canal de Venta:</label>
          <select value={plataforma} onChange={e => setPlataforma(e.target.value)} style={{ marginLeft: '10px', padding: '5px', borderRadius: '5px' }}>
            <option value="Local">Local (33%)</option>
            <option value="TikTok">TikTok (25%)</option>
          </select>
        </div>

        {carrito.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>El carrito está vacío</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Prenda</th>
                  <th>Cant.</th>
                  <th>Precio c/u</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '12px' }}>{item.descripcion}</td>
                    <td>{item.cantidad}</td>
                    <td>$ {item.precioVenta.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>$ {(item.precioVenta * item.cantidad).toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => eliminarDelCarrito(item.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '30px', textAlign: 'right', borderTop: '2px solid #111', paddingTop: '20px' }}>
              <h2 style={{ margin: 0 }}>Total Ticket: <span style={{ color: '#2e7d32' }}>$ {totalTicket.toLocaleString()}</span></h2>
              <button 
                onClick={confirmarVenta}
                disabled={estado === 'procesando'}
                style={{ marginTop: '20px', padding: '15px 40px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                {estado === 'procesando' ? 'Procesando...' : 'Confirmar Venta ✅'}
              </button>
            </div>
          </>
        )}
      </div>
      {estado === 'exito' && <p style={{ color: 'green', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>¡Venta registrada con éxito!</p>}
    </div>
  );
}