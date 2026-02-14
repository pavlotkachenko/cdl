import { TestBed } from '@angular/core/testing';
import { CapitalizeFirstLetterPipe } from './capitalize-first-letter.pipe';

describe('CapitalizeFirstLetterPipe', () => {
  let pipe: CapitalizeFirstLetterPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = new CapitalizeFirstLetterPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should capitalize the first letter of a string', () => {
    const input = 'hello';
    const transformed = pipe.transform(input);
    expect(transformed).toBe('Hello');
  });

  it('should not change an empty string', () => {
    const input = '';
    const transformed = pipe.transform(input);
    expect(transformed).toBe('');
  });

  it('should handle null input', () => {
    const input = null;
    const transformed = pipe.transform(input);
    expect(transformed).toBeNull();
  });

  it('should handle undefined input', () => {
    const input = undefined;
    const transformed = pipe.transform(input);
    expect(transformed).toBeUndefined();
  });
});
