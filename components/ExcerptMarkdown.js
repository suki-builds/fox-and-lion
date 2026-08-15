import ReactMarkdown from 'react-markdown';

// Analysis Post excerpts are a DatoCMS Markdown field (switched from plain
// text specifically to allow bullet lists) — this renders that properly
// instead of showing raw "- like this" syntax as literal characters.
//
// Pass the same className you'd have put directly on a <p> before switching
// away from plain text; the matching CSS (see .hero__desc/.hero__eyebrow in
// globals.css) zeroes out the inner <p>'s margin so a plain-text excerpt
// still renders pixel-identical to before — list styling only kicks in
// when a bullet list is actually used.
export default function ExcerptMarkdown({ children, className }) {
  if (!children) return null;
  return (
    <div className={className}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
