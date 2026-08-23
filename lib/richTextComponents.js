// Shared PrismicRichText serializer overrides, reused by both Analysis
// Post's body and News Post's commentary (see the two [slug]/page.js
// files) so any field using these renders consistently.
//
// heading6 is repurposed as a caption/supplementary-note style rather
// than an actual heading - editors get a normal-looking heading option
// in Prismic's rich text toolbar, but it renders as a <p>, not an <h6>,
// so it doesn't distort the document's heading outline for SEO/screen
// readers. See .article-body__caption in globals.css for the styling.
//
// heading5 is repurposed as a plain section divider - its text content
// is ignored (editors leave it blank or type a placeholder like "---")
// and it renders as an <hr>. See .article-body__divider in globals.css.
export const sharedRichTextComponents = {
  heading5: () => <hr className="article-body__divider" />,
  heading6: ({ children }) => <p className="article-body__caption">{children}</p>,
};
