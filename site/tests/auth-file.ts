// Where hub-auth.setup.ts saves the signed-in session, and where the hub
// content projects read it back from.
//
// This lives in its own module on purpose: playwright.hub.config.ts needs the
// path, and importing it from the setup file would make Playwright evaluate a
// file containing setup()/test() calls while loading the config, which it
// refuses to do ("Playwright Test did not expect test() to be called here").
//
// Gitignored — it holds a real session cookie. See .gitignore.
export const AUTH_FILE = 'tests/.auth/family.json';

// The BOARD session: family password plus the second, admin-only one. Separate
// file so the ordinary hub suites never carry admin rights - a test that can
// edit the directory by accident is a test that can destroy it.
export const ADMIN_AUTH_FILE = 'tests/.auth/admin.json';
