import { useState } from 'react';
import axios from 'axios';

export default function Ingresos() {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [montoPagado, setMontoPagado] = useState(''); 
  const [tipoCompra, setTipoCompra] = useState('Unidad'); // Unidad, Media Docena, Docena
  const [cantidadComprada, setCantidadComprada] = useState(''); // Ahora es la cantidad de paquetes/docenas
  const [proveedor, setProveedor] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [imagen, setImagen] = useState(null);
  const [estado, setEstado] = useState('');

  // 1. Averiguamos por cuánto hay que multiplicar
  const getMultiplicador = () => {
    if (tipoCompra === 'Docena') return 12;
    if (tipoCompra === 'Media Docena') return 6;
    return 1; // Unidad
  };

  // 2. Calculamos las prendas físicas reales
  const calcularStockReal = () => {
    return (Number(cantidadComprada) || 0) * getMultiplicador();
  };

  // 3. Calculamos cuánto nos costó CADA prenda
  const calcularCostoUnitario = () => {
    const stockTotal = calcularStockReal();
    if (stockTotal === 0) return 0;
    return (Number(montoPagado) || 0) / stockTotal;
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setEstado('guardando');

    const costoUnitarioReal = calcularCostoUnitario();
    const stockReal = calcularStockReal();

    const formData = new FormData();
    formData.append('codigo_boleta', codigo);
    formData.append('descripcion', descripcion);
    formData.append('precio_compra', costoUnitarioReal);
    formData.append('stock_actual', stockReal);
    formData.append('total_gastado', montoPagado); 
    formData.append('proveedor', proveedor);
    formData.append('fecha_compra', fechaCompra);
    if (imagen) formData.append('imagen', imagen);

    try {
      await axios.post('http://localhost:3000/api/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setEstado('exito');
      // Limpiamos todo
      setCodigo(''); setDescripcion(''); setMontoPagado(''); setCantidadComprada(''); 
      setProveedor(''); setImagen(null);
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      setEstado('error');
      console.error(error);
    }
  };

  // Textos dinámicos para el formulario
  const textoCantidad = tipoCompra === 'Docena' ? '¿Cuántas docenas llegaron?' : 
                        tipoCompra === 'Media Docena' ? '¿Cuántas medias docenas llegaron?' : 
                        '¿Cuántas prendas llegaron?';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: '#111', marginTop: 0 }}>📦 Ingreso de Mercadería</h1>
      
      <form onSubmit={guardarProducto}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>Código de Barra</label>
            <input required type="text" value={codigo} onChange={e => setCodigo(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descripción de la prenda</label>
            <input required type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} placeholder="Ej: Remera Lisa" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>Proveedor / Fabricante</label>
            <input type="text" value={proveedor} onChange={e => setProveedor(e.target.value)} style={inputStyle} placeholder="Ej: Flores" />
          </div>
          <div>
            <label style={labelStyle}>Fecha de la Compra</label>
            <input required type="date" value={fechaCompra} onChange={e => setFechaCompra(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={labelStyle}>¿Por bulto o unidad?</label>
            <select value={tipoCompra} onChange={e => setTipoCompra(e.target.value)} style={inputStyle}>
              <option value="Unidad">Por Unidad</option>
              <option value="Media Docena">Por Media Docena</option>
              <option value="Docena">Por Docena</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>{textoCantidad}</label>
            <input required type="number" value={cantidadComprada} onChange={e => setCantidadComprada(e.target.value)} style={inputStyle} placeholder="Ej: 2" />
          </div>
          <div>
            <label style={labelStyle}>Plata total gastada</label>
            <input required type="number" value={montoPagado} onChange={e => setMontoPagado(e.target.value)} style={inputStyle} placeholder="$" />
          </div>
        </div>

        {/* RECUADRO INFORMATIVO MÁGICO */}
        {montoPagado > 0 && cantidadComprada > 0 && (
          <div style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', color: '#1565c0', borderLeft: '4px solid #1976d2' }}>
            ℹ️ El sistema ingresará <b>{calcularStockReal()} prendas físicas</b> al catálogo. <br/>
            El costo individual de cada prenda será de <b>${calcularCostoUnitario().toFixed(2)}</b>.
          </div>
        )}

        <div style={{ marginBottom: '25px' }}>
          <label style={labelStyle}>Subir Foto de la Prenda (Opcional)</label>
          <input type="file" accept="image/*" onChange={e => setImagen(e.target.files[0])} style={inputStyle} />
        </div>

        <button type="submit" disabled={estado === 'guardando'} style={{ width: '100%', padding: '15px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {estado === 'guardando' ? 'Guardando en Base de Datos...' : 'Guardar Compra y Producto'}
        </button>

        {estado === 'exito' && <p style={{ color: 'green', textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>¡Producto guardado correctamente!</p>}
        {estado === 'error' && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>Hubo un error al guardar.</p>}
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px', color: '#333' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };