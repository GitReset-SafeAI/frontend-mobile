import { formatPhone, normalizePhone } from '../features/account/phone';

describe('normalizePhone', () => {
  it.each([
    ['0771234567', '+94771234567'],
    ['077 123 4567', '+94771234567'],
    ['077-123-4567', '+94771234567'],
    ['+94 77 123 4567', '+94771234567'],
    ['+94771234567', '+94771234567'],
    ['0094771234567', '+94771234567'],
    ['94771234567', '+94771234567'],
    ['(011) 234 5678', '+94112345678'],
  ])('accepts %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['', 'abc', '12345', '077123456', '07712345678', '+9477123456', '+44 7700 900123', '0071234567', '+94071234567'])(
    'rejects %s',
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );
});

describe('formatPhone', () => {
  it('writes numbers the way people read them locally', () => {
    expect(formatPhone('+94771234567')).toBe('077 123 4567');
    expect(formatPhone('+94112345678')).toBe('011 234 5678');
  });
});
