const URL_REGEX = /\bhttps?:\/\/[^\s<>"']+/g;

export function linkify(html: string): string {
  if (!html) return html;
  // Split by HTML tags — only process text segments between tags
  const parts = html.split(/(<[^>]+>)/);
  let insideAnchor = false;
  return parts.map(part => {
    if (part.startsWith('<')) {
      if (/^<a\b/i.test(part)) insideAnchor = true;
      if (/^<\/a>/i.test(part)) insideAnchor = false;
      return part;
    }
    if (insideAnchor) return part;
    URL_REGEX.lastIndex = 0;
    return part.replace(URL_REGEX, url =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-500 hover:text-indigo-700 underline break-all">${url}</a>`
    );
  }).join('');
}
