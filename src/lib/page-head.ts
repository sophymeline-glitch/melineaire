export function pageHead(title: string, description: string) {
  return { meta: [
    { title: `${title} — Melineaire` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} — Melineaire` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] };
}