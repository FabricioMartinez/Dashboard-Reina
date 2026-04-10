// src/database/models/venta.js

module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define('Venta', {
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
    tipo_venta: {
      type: DataTypes.ENUM('Local', 'TikTok', 'Docena'),
      allowNull: false // Clave para saber qué porcentaje de ganancia aplicaste
    },
    total_recaudado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'ventas',
    timestamps: false
  });

  // Relaciones
  Venta.associate = (models) => {
    // Una venta general tiene muchos "detalles" (la ropa específica que se vendió)
    Venta.hasMany(models.DetalleVenta, {
      as: 'detalles',
      foreignKey: 'venta_id'
    });
  };

  return Venta;
};