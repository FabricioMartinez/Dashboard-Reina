// src/database/models/detalle_compra.js

module.exports = (sequelize, DataTypes) => {
  const DetalleCompra = sequelize.define('DetalleCompra', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    compra_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad_ingresada: {
      type: DataTypes.INTEGER,
      allowNull: false // Fundamental para saber cuánto sumar al stock
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false // El costo de cada prenda en este viaje específico
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'detalle_compras',
    timestamps: false
  });

  // Relaciones
  DetalleCompra.associate = (models) => {
    //Un detalle pertenece a una Compra general
    DetalleCompra.belongsTo(models.Compra, {
      as: 'compra',
      foreignKey: 'compra_id'
    });

    //Un detalle pertenece a un Producto específico
    DetalleCompra.belongsTo(models.Producto, {
      as: 'producto',
      foreignKey: 'producto_id'
    });
  };

  return DetalleCompra;
};