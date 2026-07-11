import { VisualEditing } from '@sanity/visual-editing/react';

// Thin wrapper so PreviewLayout can `client:only="react"` a single import.
// Only ever rendered from PreviewLayout when draftMode is true — never
// imported by any production page, so it can't affect production bundle size.
export default function VisualEditingOverlay() {
  return <VisualEditing portal />;
}
