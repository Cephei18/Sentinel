/**
 * Docs navigation is data, not JSX, so the sidebar, the mobile picker, and
 * the prev/next pager on each page all render from the same source of truth.
 */
export interface DocsLink {
  slug: string;
  title: string;
  description: string;
}

export interface DocsGroup {
  heading: string;
  links: DocsLink[];
}

export const DOCS_NAV: DocsGroup[] = [
  {
    heading: "Get started",
    links: [
      { slug: "", title: "Introduction", description: "What the SDK is and how it fits" },
      { slug: "quickstart", title: "Quickstart", description: "Install, get a key, ship a check" },
      {
        slug: "authentication",
        title: "Authentication",
        description: "Bearer keys and where they're scoped",
      },
    ],
  },
  {
    heading: "API reference",
    links: [
      {
        slug: "agents",
        title: "Agents",
        description: "Create, fetch, list an agent's authorization",
      },
      { slug: "guardrail", title: "Guardrail check", description: "The pre-flight spend decision" },
      { slug: "events", title: "Events", description: "The append-only, hash-chained audit trail" },
      { slug: "trust-score", title: "Trust score", description: "How behavior becomes a number" },
    ],
  },
  {
    heading: "Reference",
    links: [{ slug: "errors", title: "Errors", description: "Status codes and SentinelError" }],
  },
];

export const DOCS_FLAT: DocsLink[] = DOCS_NAV.flatMap((g) => g.links);

export function docsHref(slug: string) {
  return slug ? `/docs/${slug}` : "/docs";
}

export function adjacentDocs(slug: string) {
  const i = DOCS_FLAT.findIndex((l) => l.slug === slug);
  return {
    prev: i > 0 ? DOCS_FLAT[i - 1] : null,
    next: i >= 0 && i < DOCS_FLAT.length - 1 ? DOCS_FLAT[i + 1] : null,
  };
}
