// ============================================
// Database Migration - Case Documents
// Location: backend/src/migrations/20260224000003-create-case-documents.js
// ============================================

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create case_documents table
    await queryInterface.createTable('case_documents', {
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
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      storage_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      document_type: {
        type: Sequelize.ENUM('ticket', 'license', 'court_document', 'correspondence', 'other'),
        defaultValue: 'other'
      },
      description: {
        type: Sequelize.TEXT,
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

    // Create indexes
    await queryInterface.addIndex('case_documents', ['case_id']);
    await queryInterface.addIndex('case_documents', ['uploaded_by']);
    await queryInterface.addIndex('case_documents', ['document_type']);
    await queryInterface.addIndex('case_documents', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('case_documents');
  }
};
