import { get, set, del, keys } from 'idb-keyval';

export async function saveArticleOffline(id: string, data: unknown): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(`article_${id}`, data);
}

export async function getOfflineArticle<T>(id: string): Promise<T | undefined> {
  if (typeof window === 'undefined') return undefined;
  return get<T>(`article_${id}`);
}

export async function listOfflineArticles(): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  const allKeys = await keys();
  return allKeys.filter((k) => typeof k === 'string' && k.startsWith('article_')) as string[];
}
