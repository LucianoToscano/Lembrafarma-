'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nome: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      cnpj: {
        type: DataTypes.STRING(14),
        allowNull: true,
        validate: {
          len: [14, 14]
        }
      },
      email: {
        type: DataTypes.STRING(180),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      senha: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      telefone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
        allowNull: false,
        defaultValue: 'ativo'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'usuarios',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          name: 'uq_usuarios_email',
          unique: true,
          fields: ['email']
        },
        {
          name: 'uq_usuarios_cnpj',
          unique: true,
          fields: ['cnpj']
        }
      ]
    }
  );

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Cliente, {
      foreignKey: 'usuario_id',
      as: 'clientes',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    Usuario.hasMany(models.Pedido, {
      foreignKey: 'usuario_id',
      as: 'pedidos',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  };

  return Usuario;
};
