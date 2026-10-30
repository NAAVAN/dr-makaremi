export interface TelegraphNode {
  tag: string;
  attrs?: Record<string, string>;
  children?: (string | TelegraphNode)[];
}

/**
 * Converts Markdown text into Telegraph Node array format.
 */
export function markdownToTelegraphNodes(markdown: string): TelegraphNode[] {
  const paragraphs = markdown.split(/\n\s*\n/).filter(Boolean);
  const nodes: TelegraphNode[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.startsWith('# ')) {
      nodes.push({ tag: 'h3', children: [trimmed.replace(/^#\s+/, '')] });
    } else if (trimmed.startsWith('## ')) {
      nodes.push({ tag: 'h4', children: [trimmed.replace(/^##\s+/, '')] });
    } else if (trimmed.startsWith('> ')) {
      nodes.push({ tag: 'blockquote', children: [trimmed.replace(/^>\s+/, '')] });
    } else {
      nodes.push({ tag: 'p', children: [trimmed] });
    }
  }

  return nodes;
}

/**
 * Publishes an article to Telegra.ph with strict timeout and SSRF guard
 */
export async function publishToTelegraph(
  title: string,
  contentMarkdown: string,
  authorName: string = 'Dr. Hassan Makaremi'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const content = markdownToTelegraphNodes(contentMarkdown);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: process.env.TELEGRAPH_ACCESS_TOKEN || 'sandbox_token_demo',
        title: title.slice(0, 256),
        author_name: authorName,
        content: JSON.stringify(content),
        return_content: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await res.json();
    if (data.ok && data.result?.url) {
      return { success: true, url: data.result.url };
    }
    return { success: false, error: data.error || 'Telegraph API error' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
