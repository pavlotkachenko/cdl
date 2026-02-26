// ============================================
// Database Migration - Court Dates
// Location: backend/src/migrations/20260224000004-create-court-dates.js
// ============================================

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create court_dates table
    await queryInterface.createTable('court_dates', {
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
      court_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      court_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      court_location: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      court_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      judge_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      hearing_type: {
        type: Sequelize.ENUM('arraignment', 'pre_trial', 'trial', 'sentencing', 'other'),
        defaultValue: 'other'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reminder_sent_7d: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reminder_sent_1d: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reminder_sent_2h: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      google_calendar_event_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled', 'rescheduled'),
        defaultValue: 'scheduled'
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
    await queryInterface.addIndex('court_dates', ['case_id']);
    await queryInterface.addIndex('court_dates', ['court_date']);
    await queryInterface.addIndex('court_dates', ['status']);
    await queryInterface.addIndex('court_dates', ['reminder_sent_7d']);
    await queryInterface.addIndex('court_dates', ['reminder_sent_1d']);
    await queryInterface.addIndex('court_dates', ['reminder_sent_2h']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('court_dates');
  }
};
