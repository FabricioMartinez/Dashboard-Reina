// src/database/models/producto.js

module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    codigo_boleta: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true // Fundamental: Evita que cargues dos prendas con el mismo código de barra
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    precio_compra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock_actual: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // Cuando creas un producto nuevo, arranca en 0 hasta que le cargues una compra
    },
    imagen_url: { type: DataTypes.STRING(500), allowNull: true }
  }, {
    tableName: 'productos',
    timestamps: false
  });

  // Relaciones (Las dejamos comentadas por ahora para evitar el error de modelos faltantes)
  Producto.associate = (models) => {
    //Un producto va a estar en muchos "detalles de venta" (tickets)
    Producto.hasMany(models.DetalleVenta, {
      as: 'ventas',
      foreignKey: 'producto_id'
    });

    //Un producto va a estar en muchos "detalles de compra" (ingreso de stock)
    Producto.hasMany(models.DetalleCompra, {
      as: 'compras',
      foreignKey: 'producto_id'
    });
  };

  return Producto;
};