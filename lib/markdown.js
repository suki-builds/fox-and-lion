// Strips common Markdown syntax down to plain text for contexts that need a
// short text snippet rather than rendered formatting — an SEO <meta
// description>, or a line-clamped search result excerpt — where showing
// literal "- ", "**", "[text](url)" etc. would look broken. Not a full
// parser; just enough to clean up what the DatoCMS Markdown excerpt field
// actually produces (headings, lists, emphasis, links).
export function stripMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
