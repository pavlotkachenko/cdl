import { HyphenToSpacePipe } from './hyphen-to-space.pipe';

describe('HyphenToSpacePipe', () => {
  let pipe: HyphenToSpacePipe;

  beforeEach(() => {
    pipe = new HyphenToSpacePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should replace hyphens with spaces in a string', () => {
    const inputString = 'example-text-with-hyphens';
    const result = pipe.transform(inputString);
    expect(result).toBe('example text with hyphens');
  });

  it('should handle null input', () => {
    const result = pipe.transform(null);
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    const result = pipe.transform(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle empty string input', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should handle input with no hyphens', () => {
    const inputString = 'nohyphens';
    const result = pipe.transform(inputString);
    expect(result).toBe('nohyphens');
  });
});
