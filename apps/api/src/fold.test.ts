import { describe, expect, it } from 'vitest';
import { escapeLike, fold } from './fold.js';

describe('fold', () => {
  it.each([
    ['Åkerveien 3', 'akerveien 3'],
    ['ØRNEHØGDA', 'ornehogda'],
    ['Sameiet Blåbærstien', 'sameiet blabaerstien'],
    ['Grünerløkka', 'grunerlokka'],
    ['Kafé', 'kafe'],
  ])('folds %s to %s', (input, expected) => {
    expect(fold(input)).toBe(expected);
  });

  it('gives the same result with and without æøå', () => {
    expect(fold('Blåbær')).toBe(fold('blabaer'));
    expect(fold('Sjøgata')).toBe(fold('SJOGATA'));
  });
});

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('100% _x_ a\\b')).toBe('100\\% \\_x\\_ a\\\\b');
  });
});
