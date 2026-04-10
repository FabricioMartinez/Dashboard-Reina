// src/database/models/detalle_venta.js

module.exports = (sequelize, DataTypes) => {
  const DetalleVenta = sequelize.define('DetalleVenta', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    venta_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad_vendida: {
      type: DataTypes.INTEGER,
      allowNull: false // Lo que vamos a restar del stock
    },
    precio_unitario_cobrado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false // El precio final que pagó el cliente (con el % de TikTok, Local, etc.)
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'detalle_ventas',
    timestamps: false
  });

  // Relaciones
  DetalleVenta.associate = (models) => {
    //Un detalle pertenece a una Venta general
    DetalleVenta.belongsTo(models.Venta, {
      as: 'venta',
      foreignKey: 'venta_id'
    });

    //Un detalle pertenece a un Producto específico
    DetalleVenta.belongsTo(models.Producto, {
      as: 'producto',
      foreignKey: 'producto_id'
    });
  };

  return DetalleVenta;
};