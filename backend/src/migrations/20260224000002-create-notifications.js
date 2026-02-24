// ============================================
// Database Migration - Notifications System
// Location: backend/src/migrations/20260224000002-create-notifications.js
// ============================================

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('case_update', 'new_message', 'assignment', 'court_reminder', 'system'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      channel: {
        type: Sequelize.ENUM('in_app', 'email', 'sms'),
        allowNull: false,
        defaultValue: 'in_app'
      },
      sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create notification_preferences table
    await queryInterface.createTable('notification_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      email_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sms_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      in_app_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      case_updates: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      new_messages: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      assignments: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      court_reminders: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['is_read']);
    await queryInterface.addIndex('notifications', ['sent']);
    await queryInterface.addIndex('notifications', ['created_at']);
    
    await queryInterface.addIndex('notification_preferences', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_preferences');
    await queryInterface.dropTable('notifications');
  }
};
