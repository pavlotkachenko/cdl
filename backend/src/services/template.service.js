/**
 * Template Service - Message template management with variable substitution
 * Location: backend/src/services/template.service.js
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create a new message template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template
 */
const createTemplate = async (templateData) => {
  try {
    const {
      name,
      category,
      subject,
      body,
      variables,
      isActive = true,
      createdBy
    } = templateData;

    // Validate required fields
    if (!name || !category || !body) {
      throw new Error('Name, category, and body are required');
    }

    // Extract variables from template body
    const detectedVariables = extractVariables(body);

    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        name,
        category,
        subject,
        body,
        variables: variables || detectedVariables,
        is_active: isActive,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`Template created: ${data.template_id} - ${name}`);

    return data;
  } catch (error) {
    logger.error('Error creating template:', error);
    throw error;
  }
};

/**
 * Extract variable placeholders from template body
 * @param {string} body - Template body
 * @returns {Array<string>} Array of variable names
 */
const extractVariables = (body) => {
  // Match {{variableName}} pattern
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(body)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
};

/**
 * Substitute variables in template
 * @param {string} template - Template string with {{variables}}
 * @param {Object} variables - Variable values
 * @returns {string} Template with substituted values
 */
const substituteVariables = (template, variables) => {
  try {
    let result = template;

    // Replace all {{variableName}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    });

    // Check for unsubstituted variables
    const remainingVars = extractVariables(result);
    if (remainingVars.length > 0) {
      logger.warn(`Unsubstituted variables: ${remainingVars.join(', ')}`);
    }

    return result;
  } catch (error) {
    logger.error('Error substituting variables:', error);
    throw error;
  }
};

/**
 * Get templates by category
 * @param {string} category - Template category
 * @returns {Promise<Array>} Array of templates
 */
const getTemplatesByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error getting templates by category:', error);
    throw error;
  }
};

/**
 * Get template by ID
 * @param {string} templateId - Template UUID
 * @returns {Promise<Object>} Template
 */
const getTemplateById = async (templateId) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('template_id', templateId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Template not found');

    return data;
  } catch (error) {
    logger.error('Error getting template by ID:', error);
    throw error;
  }
};

/**
 * Update template
 * @param {string} templateId - Template UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated template
 */
const updateTemplate = async (templateId, updates) => {
  try {
    // Re-extract variables if body is updated
    if (updates.body) {
      updates.variables = extractVariables(updates.body);
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('message_templates')
      .update(updates)
      .eq('template_id', templateId)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Template updated: ${templateId}`);

    return data;
  } catch (error) {
    logger.error('Error updating template:', error);
    throw error;
  }
};

/**
 * Delete template (soft delete by marking inactive)
 * @param {string} templateId - Template UUID
 * @returns {Promise<Object>} Result
 */
const deleteTemplate = async (templateId) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('template_id', templateId)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Template deleted: ${templateId}`);

    return {
      success: true,
      templateId
    };
  } catch (error) {
    logger.error('Error deleting template:', error);
    throw error;
  }
};

/**
 * Get all templates with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of templates
 */
const getAllTemplates = async (filters = {}) => {
  try {
    let query = supabase
      .from('message_templates')
      .select('*');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }

    query = query.order('category').order('name');

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error getting all templates:', error);
    throw error;
  }
};

/**
 * Render template with variables for a specific case
 * @param {string} templateId - Template UUID
 * @param {string} caseId - Case UUID
 * @returns {Promise<Object>} Rendered template
 */
const renderTemplateForCase = async (templateId, caseId) => {
  try {
    // Get template
    const template = await getTemplateById(templateId);

    // Get case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        driver:users!cases_driver_id_fkey(first_name, last_name, email, phone),
        attorney:users!cases_assigned_attorney_id_fkey(first_name, last_name, email, phone),
        operator:users!cases_assigned_operator_id_fkey(first_name, last_name, email)
      `)
      .eq('case_id', caseId)
      .single();

    if (caseError) throw caseError;
    if (!caseData) throw new Error('Case not found');

    // Build variable map
    const variableMap = {
      caseNumber: caseData.case_number,
      driverName: caseData.driver ? `${caseData.driver.first_name} ${caseData.driver.last_name}` : '',
      driverFirstName: caseData.driver ? caseData.driver.first_name : '',
      driverLastName: caseData.driver ? caseData.driver.last_name : '',
      driverEmail: caseData.driver ? caseData.driver.email : '',
      driverPhone: caseData.driver ? caseData.driver.phone : '',
      attorneyName: caseData.attorney ? `${caseData.attorney.first_name} ${caseData.attorney.last_name}` : '',
      attorneyEmail: caseData.attorney ? caseData.attorney.email : '',
      attorneyPhone: caseData.attorney ? caseData.attorney.phone : '',
      operatorName: caseData.operator ? `${caseData.operator.first_name} ${caseData.operator.last_name}` : '',
      violationType: caseData.violation_type || '',
      violationDate: caseData.violation_date || '',
      violationState: caseData.violation_state || '',
      status: caseData.status || '',
      courtDate: caseData.court_date || '',
      feeAmount: caseData.fee_amount || '',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString()
    };

    // Render template
    const renderedSubject = template.subject ? substituteVariables(template.subject, variableMap) : '';
    const renderedBody = substituteVariables(template.body, variableMap);

    return {
      templateId: template.template_id,
      name: template.name,
      category: template.category,
      subject: renderedSubject,
      body: renderedBody,
      originalTemplate: template,
      variablesUsed: variableMap
    };
  } catch (error) {
    logger.error('Error rendering template for case:', error);
    throw error;
  }
};

/**
 * Get template categories
 * @returns {Promise<Array>} Array of unique categories
 */
const getTemplateCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data.map(t => t.category))];

    return categories.sort();
  } catch (error) {
    logger.error('Error getting template categories:', error);
    throw error;
  }
};

/**
 * Preview template with sample data
 * @param {string} templateBody - Template body
 * @param {Object} sampleData - Sample variable values
 * @returns {Object} Preview result
 */
const previewTemplate = (templateBody, sampleData = {}) => {
  try {
    const variables = extractVariables(templateBody);
    
    // Use sample data or defaults
    const defaultSamples = {
      caseNumber: 'CASE-2024-001',
      driverName: 'John Doe',
      driverFirstName: 'John',
      driverLastName: 'Doe',
      driverEmail: 'john.doe@example.com',
      driverPhone: '555-0123',
      attorneyName: 'Jane Smith',
      attorneyEmail: 'jane.smith@lawfirm.com',
      attorneyPhone: '555-0456',
      operatorName: 'Mike Johnson',
      violationType: 'Speeding',
      violationDate: '2024-01-15',
      violationState: 'CA',
      status: 'in_progress',
      courtDate: '2024-02-15',
      feeAmount: '$350.00',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString()
    };

    const variableMap = { ...defaultSamples, ...sampleData };
    const rendered = substituteVariables(templateBody, variableMap);

    return {
      rendered,
      variables,
      sampleData: variableMap
    };
  } catch (error) {
    logger.error('Error previewing template:', error);
    throw error;
  }
};

module.exports = {
  createTemplate,
  extractVariables,
  substituteVariables,
  getTemplatesByCategory,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
  renderTemplateForCase,
  getTemplateCategories,
  previewTemplate
};
