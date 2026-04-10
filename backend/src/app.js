// src/app.js
const express = require('express');
const cors = require('cors'); // <-- 1. Agregamos esto
const db = require('./database/models'); // Tus modelos de Sequelize
const { Op } = require('sequelize'); // Operadores de Sequelize (para fechas)
const multer = require('multer'); // <-- NUEVO
const path = require('path');     // <-- NUEVO
const fs = require('fs');         // <-- NUEVO

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE CARPETA DE IMÁGENES ---
// 1. Creamos la carpeta "uploads" si no existe
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// 2. Le decimos a Express que la carpeta "uploads" sea pública para que React pueda ver las fotos
app.use('/uploads', express.static('uploads'));

// 3. Configuramos Multer (Dónde y con qué nombre guarda la foto)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Se guardan en la carpeta uploads
  },
  filename: function (req, file, cb) {
    // Le pone la fecha exacta adelante para que el nombre sea único
    cb(null, Date.now() + '-' + file.originalname) 
  }
});
const upload = multer({ storage: storage });

// --- RUTA 1: PANTALLA PRINCIPAL (DASHBOARD) ---
app.get('/api/dashboard', async (req, res) => {
  try {
    // 1. STOCK TOTAL EN EL LOCAL
    // Sumamos la columna 'stock_actual' de todos los productos
    const stockTotal = await db.Producto.sum('stock_actual') || 0;

    // 2. TOTAL GASTADO EN COMPRAS (Histórico)
    const totalCompras = await db.Compra.sum('total_gastado') || 0;

    // 3. VENTAS DEL DÍA (Plata que entró hoy)
    // Buscamos el inicio y fin del día actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // 00:00:00
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1); // Día siguiente

    const ventasHoy = await db.Venta.sum('total_recaudado', {
      where: {
        fecha: {
          [Op.gte]: hoy,    // Mayor o igual a hoy a las 00:00
          [Op.lt]: manana   // Menor a mañana a las 00:00
        }
      }
    }) || 0;

    // 4. INGRESOS HISTÓRICOS (Toda la plata que entró desde que abrió el local)
    const ingresosTotales = await db.Venta.sum('total_recaudado') || 0;

    // 5. GANANCIA ESTIMADA
    // Una forma rápida de ver el saldo: Plata que entró - Plata invertida
    const saldoCaja = ingresosTotales - totalCompras;

    // --- Acá mandamos todo empaquetado para que React lo dibuje ---
    res.json({
      estadisticas: {
        stock_total_prendas: stockTotal,
        ventas_hoy_efectivo: ventasHoy,
        inversion_total_compras: totalCompras,
        ingresos_totales_historico: ingresosTotales,
        saldo_caja: saldoCaja
      }
    });

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- RUTA 2: AGREGAR PRODUCTO CON FOTO Y STOCK ---
app.post('/api/productos', upload.single('imagen'), async (req, res) => {
  try {
    // Sumamos stock_actual a lo que recibimos
    const { codigo_boleta, descripcion, precio_compra, stock_actual } = req.body;
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!codigo_boleta || !descripcion || !precio_compra) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const nuevoProducto = await db.Producto.create({
      codigo_boleta,
      descripcion,
      precio_compra,
      // Si el usuario mandó stock, lo guardamos como número, sino queda en 0
      stock_actual: stock_actual ? Number(stock_actual) : 0, 
      imagen_url
    });

    res.json({ mensaje: "¡Producto guardado!", producto: nuevoProducto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear producto" });
  }
});
// --- RUTA: EDITAR PRODUCTO (NUEVA) ---
// --- RUTA: EDITAR PRODUCTO (CORREGIDA) ---
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ¡ACÁ ESTABA EL DETALLE! Agregamos stock_actual a lo que recibimos
    const { descripcion, precio_compra, stock_actual } = req.body; 
    
    const producto = await db.Producto.findByPk(id);
    if (!producto) return res.status(404).json({ error: "No existe el producto" });

    // Le decimos a la base de datos que también actualice el stock
    await producto.update({ 
      descripcion, 
      precio_compra, 
      stock_actual: Number(stock_actual) // Lo forzamos a ser número por las dudas
    });
    
    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ error: "Error al actualizar" });
  }
});
// --- RUTA: ELIMINAR PRODUCTO (NUEVA) ---
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await db.Producto.findByPk(id);
    if (!producto) return res.status(404).json({ error: "No existe el producto" });

    await producto.destroy();
    res.json({ mensaje: "Producto eliminado del sistema" });
  } catch (error) {
    res.status(500).json({ error: "No se puede eliminar un producto que ya tiene ventas o compras asociadas" });
  }
});


// --- RUTA 3: LEER CÓDIGO DE BARRAS ---
// Esta es la ruta que se dispara cuando pasas la pistola por la etiqueta
app.get('/api/productos/:codigo', async (req, res) => {
  try {
    // Extraemos el código que viene en la URL
    const codigoEscaneado = req.params.codigo;

    // Buscamos en la base de datos un producto con ese código exacto
    const producto = await db.Producto.findOne({
      where: { codigo_boleta: codigoEscaneado }
    });

    // Si el lector lee un código que no tenemos en el sistema:
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado en el sistema" });
    }

    // Si lo encuentra, se lo devolvemos a React para que lo muestre en pantalla
    res.json({ producto });

  } catch (error) {
    console.error("Error al buscar el producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- RUTA 4: REGISTRAR UNA COMPRA Y SUMAR STOCK ---
app.post('/api/compras', async (req, res) => {
  // Acá vamos a usar algo llamado "Transacción". 
  // Sirve para que, si falla algo a la mitad (ej: se corta la luz), no se guarde nada a medias y no se arruine tu stock.
  const t = await db.sequelize.transaction();

  try {
    // 1. Recibimos los datos generales y la lista de ropa que entró
    const { proveedor, total_gastado, detalles } = req.body;

    // 2. Creamos la "Cabecera" de la compra
    const nuevaCompra = await db.Compra.create({
      proveedor: proveedor,
      total_gastado: total_gastado
    }, { transaction: t });

    // 3. Recorremos la lista de ropa que trajimos usando un bucle (for)
    for (let item of detalles) {
      
      // A. Guardamos el detalle de esta prenda específica
      await db.DetalleCompra.create({
        compra_id: nuevaCompra.id,
        producto_id: item.producto_id,
        cantidad_ingresada: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }, { transaction: t });

      // B. ¡LA MAGIA DEL STOCK! Buscamos la prenda y le sumamos lo que trajimos
      const producto = await db.Producto.findByPk(item.producto_id, { transaction: t });
      if (producto) {
        producto.stock_actual += item.cantidad; // Le sumamos la cantidad
        await producto.save({ transaction: t }); // Guardamos el nuevo stock
      }
    }

    // 4. Si todo salió bien hasta acá, confirmamos la transacción para que se guarde de verdad
    await t.commit();

    res.json({
      mensaje: "¡Compra registrada exitosamente! El stock ha sido actualizado.",
      compra_id: nuevaCompra.id
    });

  } catch (error) {
    // Si hubo algún error en el medio, deshacemos todo para no romper la base de datos
    await t.rollback();
    console.error("Error al registrar la compra:", error);
    res.status(500).json({ error: "Error interno al guardar la compra" });
  }
});

// --- RUTA 5: REGISTRAR UNA VENTA Y RESTAR STOCK ---
app.post('/api/ventas', async (req, res) => {
  // Volvemos a usar una transacción para proteger los datos
  const t = await db.sequelize.transaction();

  try {
    const { tipo_venta, detalles } = req.body; 
    // tipo_venta tiene que ser 'Local', 'TikTok' o 'Docena'
    
    let total_recaudado = 0;
    let detallesAProcesar = [];

    // 1. Validar stock y calcular los precios dinámicos
    for (let item of detalles) {
      const producto = await db.Producto.findByPk(item.producto_id, { transaction: t });
      
      // Chequeo de seguridad: ¿Existe y hay stock?
      if (!producto) throw new Error(`El producto ID ${item.producto_id} no existe.`);
      if (producto.stock_actual < item.cantidad) {
        throw new Error(`No hay stock suficiente para ${producto.descripcion}. Quedan ${producto.stock_actual}.`);
      }

      // Calculamos el porcentaje según dónde se vendió
      let porcentaje = 0;
      if (tipo_venta === 'Local') porcentaje = 0.50;
      if (tipo_venta === 'TikTok') porcentaje = 0.35;
      if (tipo_venta === 'Docena') porcentaje = 0.20;

      // Matemática: Costo + (Costo * Porcentaje)
      const precio_cobrado = Number(producto.precio_compra) + (Number(producto.precio_compra) * porcentaje);
      const subtotal = precio_cobrado * item.cantidad;

      total_recaudado += subtotal;

      // Guardamos los datos calculados temporalmente para el siguiente paso
      detallesAProcesar.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario_cobrado: precio_cobrado,
        subtotal: subtotal,
        producto_instance: producto // Guardamos el objeto para restarle el stock en breve
      });
    }

    // 2. Creamos la "Cabecera" del ticket de venta
    const nuevaVenta = await db.Venta.create({
      tipo_venta: tipo_venta,
      total_recaudado: total_recaudado
    }, { transaction: t });

    // 3. Guardamos los detalles y RESTAMOS EL STOCK
    for (let dp of detallesAProcesar) {
      await db.DetalleVenta.create({
        venta_id: nuevaVenta.id,
        producto_id: dp.producto_id,
        cantidad_vendida: dp.cantidad,
        precio_unitario_cobrado: dp.precio_unitario_cobrado,
        subtotal: dp.subtotal
      }, { transaction: t });

      // Acá hacemos la resta mágica
      dp.producto_instance.stock_actual -= dp.cantidad;
      await dp.producto_instance.save({ transaction: t });
    }

    // 4. Si todo está perfecto, confirmamos la operación
    await t.commit();

    res.json({
      mensaje: "¡Venta registrada con éxito!",
      venta_id: nuevaVenta.id,
      total_cobrado: total_recaudado
    });

  } catch (error) {
    await t.rollback();
    // Le mandamos a React el error exacto (ej: "No hay stock suficiente")
    res.status(400).json({ error: error.message });
  }
});

// --- RUTA 6: REGISTRAR UN RETIRO DE EFECTIVO ---
app.post('/api/retiros', async (req, res) => {
  try {
    const { socio_id, monto } = req.body;

    if (!socio_id || !monto) {
      return res.status(400).json({ error: "Faltan indicar el socio y el monto" });
    }

    // Creamos el registro. Por defecto, tu base de datos le pone estado 'Pendiente' y la fecha actual.
    const nuevoRetiro = await db.RetiroEfectivo.create({
      socio_id: socio_id,
      monto: monto
    });

    res.json({
      mensaje: "¡Retiro de efectivo registrado correctamente!",
      retiro: nuevoRetiro
    });

  } catch (error) {
    console.error("Error al registrar el retiro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- RUTA 7: VER RETIROS PENDIENTES (Quién debe plata) ---
app.get('/api/retiros/pendientes', async (req, res) => {
  try {
    const deudas = await db.RetiroEfectivo.findAll({
      where: { estado: 'Pendiente' },
      include: [
        {
          model: db.Socio,
          as: 'socio',
          attributes: ['nombre'] // Le pedimos que solo traiga el nombre para no ensuciar los datos
        }
      ],
      order: [['fecha', 'DESC']] // Ordenamos para ver los más recientes arriba
    });

    res.json({
      mensaje: "Lista de deudas pendientes",
      deudas: deudas
    });

  } catch (error) {
    console.error("Error al buscar deudas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- RUTA 8: MARCAR RETIRO COMO DEVUELTO (PAGADO) ---
app.put('/api/retiros/:id/pagado', async (req, res) => {
  try {
    const retiroId = req.params.id;
    
    // Buscamos el retiro específico por su ID
    const retiro = await db.RetiroEfectivo.findByPk(retiroId);

    if (!retiro) {
      return res.status(404).json({ error: "Retiro no encontrado" });
    }

    // Le cambiamos el estado para que deje de aparecer en la lista
    retiro.estado = 'Devuelto';
    await retiro.save();

    res.json({ mensaje: "¡Deuda marcada como pagada!" });

  } catch (error) {
    console.error("Error al actualizar la deuda:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- RUTA 9: OBTENER TODOS LOS SOCIOS ---
app.get('/api/socios', async (req, res) => {
  try {
    const socios = await db.Socio.findAll();
    res.json({ socios });
  } catch (error) {
    console.error("Error al buscar socios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- RUTA 10: VER CATÁLOGO Y BUSCADOR ---
app.get('/api/productos', async (req, res) => {
  try {
    const { buscar } = req.query; // Capturamos lo que escribís en el buscador
    let condicion = {};

    // Si escribiste algo, le decimos a la base de datos que busque coincidencias
    if (buscar) {
      condicion = {
        [Op.or]: [
          { descripcion: { [Op.like]: `%${buscar}%` } }, // Busca por palabra
          { codigo_boleta: { [Op.like]: `%${buscar}%` } } // O busca por código
        ]
      };
    }

    const productos = await db.Producto.findAll({
      where: condicion,
      order: [['descripcion', 'ASC']] // Los ordenamos alfabéticamente
    });

    res.json({ productos });

  } catch (error) {
    console.error("Error al cargar el catálogo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- RUTA 11: HISTORIAL DE ÚLTIMAS VENTAS (DASHBOARD) ---
app.get('/api/ventas/ultimas', async (req, res) => {
  try {
    // Buscamos las últimas 10 ventas registradas
    const ventas = await db.Venta.findAll({
      limit: 10, // Solo traemos 10 para no hacer infinita la pantalla principal
      order: [['id', 'DESC']] // Ordenamos por ID de mayor a menor (las más nuevas primero)
    });
    
    res.json({ ventas });
  } catch (error) {
    console.error("Error al obtener las últimas ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});




// Inicialización del servidor
app.listen(port, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  try {
    await db.sequelize.authenticate();
    console.log('✅ Base de datos conectada.');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
});