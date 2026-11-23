import type {
  CommerceArchiveOptionsPayload,
  CommerceArchiveWorkOption,
  LocalizedTextMap,
} from '@makaremi/shared';
import { getArtworks, getBooks, getPoems, getVideoSpeeches } from '@/lib/cms';
import { resolveProxiedMediaUrl, resolveVideoCoverUrl } from '@/lib/media-url';

function pickLocalizedTitle(
  translations: Array<{ languages_code: string; title: string }> | undefined,
  fallbackSlug: string
): LocalizedTextMap {
  const list = translations || [];
  const faRaw = list.find((t) => (t.languages_code || '').toLowerCase().startsWith('fa'))?.title?.trim();
  const frRaw = list.find((t) => (t.languages_code || '').toLowerCase().startsWith('fr'))?.title?.trim();
  const enRaw = list.find((t) => (t.languages_code || '').toLowerCase().startsWith('en'))?.title?.trim();
  const anyTitle = faRaw || frRaw || enRaw || fallbackSlug.replace(/-/g, ' ');

  return {
    fa: faRaw || anyTitle,
    fr: frRaw || enRaw || anyTitle,
    en: enRaw || frRaw || anyTitle,
  };
}

/**
 * Builds the complete, compact archive work index (including Vault records,
 * supplemental books, and custom works added via Pishkhan) so the Commerce
 * panel can populate cascading dropdown lists with live image previews.
 */
export async function getCommerceArchiveSelectableWorks(): Promise<CommerceArchiveOptionsPayload> {
  const [artworksRaw, booksRaw, poemsRaw, videosRaw] = await Promise.all([
    getArtworks('fa'),
    getBooks('fa'),
    getPoems('fa'),
    getVideoSpeeches('fa'),
  ]);

  let totalPlates = 0;

  const artworks: CommerceArchiveWorkOption[] = artworksRaw.map((art) => {
    const title = pickLocalizedTitle(art.translations, art.slug);
    const plates = (art.gallery_images || []).map((g, idx) => ({
      id: g.id,
      title: g.title?.trim() || `تابلوی شماره ${idx + 1}`,
      imageUrl: resolveProxiedMediaUrl(g.url, 'art', g.title || title.fr) || '',
    }));
    totalPlates += plates.length;

    const primaryImage = resolveProxiedMediaUrl(
      art.image_url || art.gallery_images?.[0]?.url || null,
      'art',
      title.fr
    );

    return {
      collection: 'artworks',
      slug: art.slug,
      title,
      year: art.year || null,
      imageUrl: primaryImage,
      medium: art.medium || null,
      dimensions: art.dimensions || null,
      plates,
    };
  });

  const books: CommerceArchiveWorkOption[] = booksRaw.map((book) => {
    const title = pickLocalizedTitle(book.translations, book.slug);
    const publisherName =
      book.translations?.find((t) => t.publisher_name?.trim())?.publisher_name?.trim() || null;

    const seenLinks = new Set<string>();
    const externalLinks: Array<{ platform: string; url: string; label: string }> = [];
    for (const tr of book.translations || []) {
      const geo = tr.geo_acquisition_links;
      for (const link of [...(geo?.international || []), ...(geo?.iran || [])]) {
        if (!link?.url || seenLinks.has(link.url)) continue;
        seenLinks.add(link.url);
        externalLinks.push({
          platform: link.platform || 'ناشر',
          url: link.url,
          label: link.label || link.platform || link.url,
        });
      }
    }

    return {
      collection: 'books',
      slug: book.slug,
      title,
      year: book.publication_year || null,
      imageUrl: resolveProxiedMediaUrl(book.cover_image_url, 'book', title.fr),
      publisherName,
      isbn: book.isbn_13 || null,
      pdfUrls: Array.isArray(book.pdf_urls) ? book.pdf_urls.filter(Boolean) : [],
      externalLinks,
    };
  });

  const poems: CommerceArchiveWorkOption[] = poemsRaw.map((poem) => {
    const title = pickLocalizedTitle(poem.translations, poem.slug);
    return {
      collection: 'poems',
      slug: poem.slug,
      title,
      year: poem.creation_year || null,
      imageUrl: poem.artwork_image_url
        ? resolveProxiedMediaUrl(poem.artwork_image_url, 'art', title.fr)
        : null,
    };
  });

  const videos: CommerceArchiveWorkOption[] = videosRaw.map((video) => {
    const title = pickLocalizedTitle(video.translations, video.slug);
    const parsedYear = Number((video.event_date || '').slice(0, 4));
    return {
      collection: 'videos',
      slug: video.slug,
      title,
      year: Number.isFinite(parsedYear) && parsedYear > 1950 ? parsedYear : null,
      imageUrl: resolveVideoCoverUrl(video, title.fr),
    };
  });

  return {
    counts: {
      artworks: artworks.length,
      artworkPlates: totalPlates,
      books: books.length,
      poems: poems.length,
      videos: videos.length,
    },
    artworks,
    books,
    poems,
    videos,
  };
}
