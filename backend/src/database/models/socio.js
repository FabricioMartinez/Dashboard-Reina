// src/database/models/socio.js

module.exports = (sequelize, DataTypes) => {
  const Socio = sequelize.define('Socio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    // Configuraciones adicionales
    tableName: 'socios', // Nombre exacto de la tabla en MySQL
    timestamps: false    // Si no creaste las columnas createdAt/updatedAt, ponelo en false
  });

  // Relaciones (Asociaciones)
  Socio.associate = (models) => {
    // Un socio tiene muchos retiros de efectivo
    Socio.hasMany(models.RetiroEfectivo, {
      as: 'retiros',
      foreignKey: 'socio_id'
    });
  };

  return Socio;
};