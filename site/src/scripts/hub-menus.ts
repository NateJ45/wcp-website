// ============================================================================
// hub-menus — light dropdown behavior for the hub's <details> menus
// ============================================================================
// The topbar's bell and quick-action menus are native <details data-hub-menu>
// elements: keyboard-toggleable and fully usable with NO JS. This script only
// adds the two behaviors native details lacks as a dropdown: close on outside
// click, and close on Escape (returning focus to the summary). Also closes any
// OTHER open menu when one opens, so two panels never stack.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const menus = () => document.querySelectorAll<HTMLDetailsElement>('details[data-hub-menu]');

onPageLoad(() => {
  if (!document.querySelector('details[data-hub-menu]')) return;

  // pointerdown, not click: iOS Safari only synthesizes a bubbling click for
  // taps on "clickable" targets (interactive elements or cursor:pointer), so a
  // document-level click listener never fires when a parent taps blank canvas
  // to dismiss — the panel stayed open. pointerdown fires for every touch on
  // every element (iOS 13+), and closing on press-down feels snappier anyway.
  document.addEventListener('pointerdown', (e) => {
    for (const menu of menus()) {
      if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const menu of menus()) {
      if (!menu.open) continue;
      menu.open = false;
      menu.querySelector<HTMLElement>('summary')?.focus();
    }
  });

  // One menu at a time.
  for (const menu of menus()) {
    menu.addEventListener('toggle', () => {
      if (!menu.open) return;
      for (const other of menus()) {
        if (other !== menu && other.open) other.open = false;
      }
    });
  }
});

export {};
