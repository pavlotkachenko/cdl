// ============================================
// QUICK QUESTION SERVICE
// Database operations for quick questions
// ============================================

const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');

/**
 * Get active quick questions
 */
const getActiveQuestions = async (category = null) => {
  try {
    let query = supabase
      .from('quick_questions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: questions, error } = await query;

    if (error) {
      throw new AppError(`Database error: ${error.message}`, 500);
    }

    return questions || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch quick questions', 500);
  }
};

/**
 * Create new quick question
 */
const createQuestion = async ({ question, category, sortOrder }) => {
  try {
    const { data: newQuestion, error } = await supabase
      .from('quick_questions')
      .insert([{
        question,
        category: category || 'general',
        sort_order: sortOrder || 0,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create question: ${error.message}`, 500);
    }

    return newQuestion;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create quick question', 500);
  }
};

/**
 * Update quick question
 */
const updateQuestion = async (questionId, updates) => {
  try {
    const { data: updatedQuestion, error } = await supabase
      .from('quick_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Question not found', 404);
      }
      throw new AppError(`Failed to update question: ${error.message}`, 500);
    }

    return updatedQuestion;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update quick question', 500);
  }
};

/**
 * Delete quick question
 */
const deleteQuestion = async (questionId) => {
  try {
    const { error } = await supabase
      .from('quick_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      throw new AppError(`Failed to delete question: ${error.message}`, 500);
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete quick question', 500);
  }
};

module.exports = {
  getActiveQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
};
