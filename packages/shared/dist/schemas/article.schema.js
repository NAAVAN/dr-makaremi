import { z } from 'zod';
export const ContentPillarSchema = z.enum([
    'psychoanalysis',
    'art_calligraphy',
    'cultural_strategy',
    'human_rights_dadkhahi',
]);
export const ArticleTranslationSchema = z.object({
    id: z.string().uuid().optional(),
    articles_id: z.string().uuid().optional(),
    languages_code: z.enum(['fa-IR', 'fr-FR', 'en-US']),
    title: z.string().min(2).max(255),
    executive_summary: z.string().min(10),
    body_markdown: z.string().min(10),
    meta_title: z.string().max(255).nullable().optional(),
    meta_description: z.string().nullable().optional(),
    canonical_url: z.string().url().nullable().optional(),
});
export const ArticleSchema = z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
    pillar: ContentPillarSchema,
    status: z.enum(['draft', 'review_pending', 'published', 'archived']).default('draft'),
    cover_image_id: z.string().uuid().nullable().optional(),
    audio_summary_file_id: z.string().uuid().nullable().optional(),
    content_sha256: z.string().length(64),
    embedding: z.array(z.number()).length(1536).nullable().optional(),
    published_at: z.string().datetime().nullable().optional(),
    translations: z.array(ArticleTranslationSchema).optional(),
});
//# sourceMappingURL=article.schema.js.map