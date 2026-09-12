import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  resolvePage,
  resolvePageSize,
} from './Pagination';

describe('resolvePage', () => {
  it('parses a positive integer', () => {
    expect(resolvePage('3')).toBe(3);
  });

  it.each([undefined, '', 'abc', '0', '-1', '1.5'])(
    'falls back to the default for %p',
    (value) => {
      expect(resolvePage(value)).toBe(DEFAULT_PAGE);
    },
  );
});

describe('resolvePageSize', () => {
  it('parses a positive integer', () => {
    expect(resolvePageSize('25')).toBe(25);
  });

  it.each([undefined, '', 'abc', '0', '-5', '2.5'])(
    'falls back to the default for %p',
    (value) => {
      expect(resolvePageSize(value)).toBe(DEFAULT_PAGE_SIZE);
    },
  );

  it('clamps a request above the maximum', () => {
    expect(resolvePageSize('1000')).toBe(MAX_PAGE_SIZE);
  });

  it('allows exactly the maximum', () => {
    expect(resolvePageSize(String(MAX_PAGE_SIZE))).toBe(MAX_PAGE_SIZE);
  });
});
