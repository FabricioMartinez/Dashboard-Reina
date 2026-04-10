// src/database/models/retiro_efectivo.js

module.exports = (sequelize, DataTypes) => {
  const RetiroEfectivo = sequelize.define('RetiroEfectivo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    socio_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'Devuelto'),
      defaultValue: 'Pendiente'
    }
  }, {
    tableName: 'retiros_efectivo',
    timestamps: false
  });

  // Relaciones (Ya activadas)
  RetiroEfectivo.associate = (models) => {
    // Un retiro de dinero pertenece a un Socio específico
    RetiroEfectivo.belongsTo(models.Socio, {
      as: 'socio',
      foreignKey: 'socio_id'
    });
  };

  return RetiroEfectivo;
};