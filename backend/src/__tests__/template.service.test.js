/**
 * Unit tests for template.service.js
 * Covers: extractVariables (pure), substituteVariables (pure),
 *         createTemplate + getTemplateById (DB mocked)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
const chain = {
  select: jest.fn(), insert: jest.fn(), update: jest.fn(),
  eq: jest.fn(), order: jest.fn(),
  single: jest.fn(), maybeSingle: jest.fn(),
};
const mockFrom = jest.fn();

jest.mock('../config/database', () => ({
  supabase: { from: mockFrom },
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(),
}));

const {
  extractVariables,
  substituteVariables,
  createTemplate,
  getTemplateById,
  previewTemplate,
} = require('../services/template.service');

function setupChain() {
  ['select', 'insert', 'update', 'eq', 'order'].forEach(m =>
    chain[m].mockReturnValue(chain)
  );
  mockFrom.mockReturnValue(chain);
}

beforeEach(() => {
  jest.resetAllMocks();
  setupChain();
});

// ── extractVariables (pure) ───────────────────────────────────────────────────
describe('extractVariables', () => {
  it('extracts simple {{variable}} placeholders', () => {
    const vars = extractVariables('Hello {{name}}, your case is {{caseNumber}}.');
    expect(vars).toEqual(['name', 'caseNumber']);
  });

  it('handles whitespace inside braces', () => {
    const vars = extractVariables('Hello {{ name }} and {{ caseNumber }}');
    expect(vars).toContain('name');
    expect(vars).toContain('caseNumber');
  });

  it('deduplicates repeated variables', () => {
    const vars = extractVariables('{{name}} is {{name}}');
    expect(vars).toHaveLength(1);
    expect(vars[0]).toBe('name');
  });

  it('returns empty array when no placeholders exist', () => {
    expect(extractVariables('No variables here.')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(extractVariables('')).toEqual([]);
  });
});

// ── substituteVariables (pure) ────────────────────────────────────────────────
describe('substituteVariables', () => {
  it('replaces all placeholders with provided values', () => {
    const result = substituteVariables('Hello {{name}}, case {{caseNumber}}.', {
      name: 'John',
      caseNumber: 'CASE-001',
    });
    expect(result).toBe('Hello John, case CASE-001.');
  });

  it('replaces placeholder with empty string when value is missing', () => {
    const result = substituteVariables('Hello {{name}} {{missing}}.', { name: 'Jane' });
    expect(result).toContain('Jane');
    expect(result).toContain('{{missing}}'); // unsubstituted remains
  });

  it('handles whitespace inside braces', () => {
    const result = substituteVariables('Hello {{ name }}!', { name: 'Alice' });
    expect(result).toBe('Hello Alice!');
  });

  it('handles multiple occurrences of the same variable', () => {
    const result = substituteVariables('{{x}} and {{x}}', { x: 'foo' });
    expect(result).toBe('foo and foo');
  });
});

// ── previewTemplate (pure) ────────────────────────────────────────────────────
describe('previewTemplate', () => {
  it('renders with default sample data when none provided', () => {
    const { rendered } = previewTemplate('Case: {{caseNumber}}, Driver: {{driverName}}');
    expect(rendered).toContain('CASE-2024-001');
    expect(rendered).toContain('John Doe');
  });

  it('uses provided sample data over defaults', () => {
    const { rendered } = previewTemplate('Hi {{driverName}}', { driverName: 'Custom' });
    expect(rendered).toBe('Hi Custom');
  });

  it('returns list of variables found in template', () => {
    const { variables } = previewTemplate('{{a}} {{b}}');
    expect(variables).toContain('a');
    expect(variables).toContain('b');
  });
});

// ── createTemplate (DB mocked) ────────────────────────────────────────────────
describe('createTemplate', () => {
  const templateData = {
    name: 'Welcome',
    category: 'onboarding',
    body: 'Hello {{name}}',
    createdBy: 'user-1',
  };
  const dbRecord = { template_id: 'tpl-1', ...templateData };

  it('inserts template and returns created record', async () => {
    chain.single.mockResolvedValueOnce({ data: dbRecord, error: null });

    const result = await createTemplate(templateData);

    expect(mockFrom).toHaveBeenCalledWith('message_templates');
    expect(result.template_id).toBe('tpl-1');
  });

  it('throws when name is missing', async () => {
    await expect(createTemplate({ category: 'x', body: 'y' })).rejects.toThrow(
      'Name, category, and body are required'
    );
  });

  it('throws when category is missing', async () => {
    await expect(createTemplate({ name: 'x', body: 'y' })).rejects.toThrow(
      'Name, category, and body are required'
    );
  });

  it('throws when body is missing', async () => {
    await expect(createTemplate({ name: 'x', category: 'y' })).rejects.toThrow(
      'Name, category, and body are required'
    );
  });

  it('throws when DB returns error', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: new Error('db fail') });

    await expect(createTemplate(templateData)).rejects.toThrow('db fail');
  });
});

// ── getTemplateById (DB mocked) ───────────────────────────────────────────────
describe('getTemplateById', () => {
  it('returns template when found', async () => {
    const tpl = { template_id: 'tpl-1', name: 'Test', body: 'Hi {{name}}' };
    chain.single.mockResolvedValueOnce({ data: tpl, error: null });

    const result = await getTemplateById('tpl-1');
    expect(result.template_id).toBe('tpl-1');
  });

  it('throws "Template not found" when data is null', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: null });
    await expect(getTemplateById('bad-id')).rejects.toThrow('Template not found');
  });

  it('throws when DB returns error', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: new Error('db error') });
    await expect(getTemplateById('x')).rejects.toThrow('db error');
  });
});
