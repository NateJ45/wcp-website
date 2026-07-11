// Shared News constants. Kept in a module (not a page frontmatter const) so
// getStaticPaths — which Astro runs in its own isolated scope — can import it.

/** Posts per page on the /news index. */
export const NEWS_PAGE_SIZE = 9;
