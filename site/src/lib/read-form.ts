// =============================================================================
// read-form — one safe way for a POST endpoint to read its form body
// =============================================================================
// `request.formData()` THROWS when the body is not form-encoded — a JSON body,
// an empty body, or a truncated one. Astro's CSRF Origin check only guards the
// form content-types, so a hand-crafted `Content-Type: application/json` POST
// slips past it and then crashes formData() with an unhandled 500. A real
// browser form never does this (it posts form data with an Origin, which the
// CSRF check clears), but an endpoint should answer a bad request with a clean
// 400, not a stack trace.
//
// Found 2026-08-29, probing the live endpoints: an empty POST and a malformed
// JSON POST to /api/contact both returned 500. Every form endpoint shared the
// unguarded `await request.formData()`.
//
// Returns the FormData on success, or null when the body is unreadable. A null
// return means "reject this" — the caller sends its own 400 in its own shape
// (JSON for a fetch, a redirect for a no-JS post), which this helper cannot
// know.
// =============================================================================

/** Read a request's form body, or null when it is not form-encoded. */
export async function readForm(request: Request): Promise<FormData | null> {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}
