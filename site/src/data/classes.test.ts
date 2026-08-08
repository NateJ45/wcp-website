import { describe, it, expect } from 'vitest';
import { payUrl, classes } from './classes';

describe('payUrl', () => {
  it('wraps a bare legacy button code in the old webscr checkout URL', () => {
    expect(payUrl('GQZ67ZRZ4W9UN')).toBe(
      'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=GQZ67ZRZ4W9UN',
    );
  });

  it('passes a new-style (NCP) payment link through untouched', () => {
    const link = 'https://www.paypal.com/ncp/payment/PVP3W4TNLKRPA';
    expect(payUrl(link)).toBe(link);
  });

  it('produces a paypal.com URL for every stored class pay value', () => {
    // A typo'd fallback (stray space, missing id) would send a family to a
    // broken checkout — every stored value must build a well-formed PayPal URL.
    for (const c of classes) {
      for (const value of [c.payId, c.studentFeePayId]) {
        const url = new URL(payUrl(value));
        expect(url.hostname).toBe('www.paypal.com');
        if (url.pathname === '/cgi-bin/webscr') {
          expect(url.searchParams.get('hosted_button_id')).toMatch(/^[A-Z0-9]+$/);
        } else {
          expect(url.pathname).toMatch(/^\/ncp\/payment\/[A-Z0-9]+$/);
        }
      }
    }
  });
});
