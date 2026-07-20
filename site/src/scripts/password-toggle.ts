import { onPageLoad } from './_page-load';

// =============================================================================
// Show/hide password
// =============================================================================
// NIST SP 800-63B: verifiers "SHOULD offer an option to display the password
// ... while it is entered". Worth having here specifically because the Family
// Hub uses ONE long shared passphrase that families typically retype from a
// welcome email on a phone, which is the exact case where masking causes
// repeated failed attempts.
//
// PROGRESSIVE ENHANCEMENT: the button ships with the `hidden` attribute and
// this script reveals it. No JS means no dead control — the field still works,
// it just stays masked.
//
// HIDDEN BY DEFAULT, always (GOV.UK): a family may be signing in somewhere
// public, and revealing by default takes that choice away from them.
//
// The button's TEXT carries the state and there is deliberately NO aria-pressed.
// Doing both makes screen readers announce the change twice, once through the
// name and once through the state — the same mistake the theme toggle used to
// make. The status live region is how the change is announced, which is the
// GOV.UK password-input pattern.
// =============================================================================

onPageLoad(() => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-password-toggle]');

  for (const button of buttons) {
    const inputId = button.getAttribute('aria-controls');
    const input = inputId ? document.getElementById(inputId) : null;
    if (!(input instanceof HTMLInputElement)) continue;

    const status = document.querySelector<HTMLElement>(`[data-password-status="${inputId}"]`);

    // Only now is the control real.
    button.hidden = false;

    button.addEventListener('click', () => {
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.textContent = reveal ? 'Hide' : 'Show';
      if (status) {
        status.textContent = reveal ? 'Your password is visible.' : 'Your password is hidden.';
      }
      // Put the caret back where the family was typing.
      input.focus();
    });
  }
});
