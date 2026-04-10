// src/database/models/compra.js

module.exports = (sequelize, DataTypes) => {
  const Compra = sequelize.define('Compra', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    proveedor: {
      type: DataTypes.STRING(150),
      allowNull: true // Lo dejamos 'true' por si a veces compran en Once/Flores y no anotan el nombre
    },
    total_gastado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'compras',
    timestamps: false
  });

  // Relaciones
  Compra.associate = (models) => {
    // Una compra tiene muchos "detalles" (la ropa específica que entró)
    Compra.hasMany(models.DetalleCompra, {
      as: 'detalles',
      foreignKey: 'compra_id'
    });
  };

  return Compra;
};