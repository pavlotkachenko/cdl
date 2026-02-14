// ============================================
// Database Migration - Messaging System
// Location: backend/src/migrations/XXXXXX-create-messaging-tables.js
// ============================================

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create conversations table
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      case_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driver_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      attorney_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      last_message_at: {
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

    // Create messages table
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      message_type: {
        type: Sequelize.ENUM('text', 'file', 'video_link', 'quick_question'),
        defaultValue: 'text'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_at: {
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

    // Create message_attachments table
    await queryInterface.createTable('message_attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      message_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for better performance
    await queryInterface.addIndex('conversations', ['driver_id']);
    await queryInterface.addIndex('conversations', ['attorney_id']);
    await queryInterface.addIndex('conversations', ['case_id']);
    await queryInterface.addIndex('conversations', ['last_message_at']);

    await queryInterface.addIndex('messages', ['conversation_id']);
    await queryInterface.addIndex('messages', ['sender_id']);
    await queryInterface.addIndex('messages', ['recipient_id']);
    await queryInterface.addIndex('messages', ['is_read']);
    await queryInterface.addIndex('messages', ['created_at']);

    await queryInterface.addIndex('message_attachments', ['message_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('message_attachments');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversations');
  }
};
