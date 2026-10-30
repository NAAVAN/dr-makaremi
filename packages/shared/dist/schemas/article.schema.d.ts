import { z } from 'zod';
export declare const ContentPillarSchema: z.ZodEnum<["psychoanalysis", "art_calligraphy", "cultural_strategy", "human_rights_dadkhahi"]>;
export declare const ArticleTranslationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    articles_id: z.ZodOptional<z.ZodString>;
    languages_code: z.ZodEnum<["fa-IR", "fr-FR", "en-US"]>;
    title: z.ZodString;
    executive_summary: z.ZodString;
    body_markdown: z.ZodString;
    meta_title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    canonical_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    languages_code: "fa-IR" | "fr-FR" | "en-US";
    title: string;
    executive_summary: string;
    body_markdown: string;
    id?: string | undefined;
    articles_id?: string | undefined;
    meta_title?: string | null | undefined;
    meta_description?: string | null | undefined;
    canonical_url?: string | null | undefined;
}, {
    languages_code: "fa-IR" | "fr-FR" | "en-US";
    title: string;
    executive_summary: string;
    body_markdown: string;
    id?: string | undefined;
    articles_id?: string | undefined;
    meta_title?: string | null | undefined;
    meta_description?: string | null | undefined;
    canonical_url?: string | null | undefined;
}>;
export declare const ArticleSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    pillar: z.ZodEnum<["psychoanalysis", "art_calligraphy", "cultural_strategy", "human_rights_dadkhahi"]>;
    status: z.ZodDefault<z.ZodEnum<["draft", "review_pending", "published", "archived"]>>;
    cover_image_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    audio_summary_file_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content_sha256: z.ZodString;
    embedding: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber, "many">>>;
    published_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    translations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        articles_id: z.ZodOptional<z.ZodString>;
        languages_code: z.ZodEnum<["fa-IR", "fr-FR", "en-US"]>;
        title: z.ZodString;
        executive_summary: z.ZodString;
        body_markdown: z.ZodString;
        meta_title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        meta_description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        canonical_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        executive_summary: string;
        body_markdown: string;
        id?: string | undefined;
        articles_id?: string | undefined;
        meta_title?: string | null | undefined;
        meta_description?: string | null | undefined;
        canonical_url?: string | null | undefined;
    }, {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        executive_summary: string;
        body_markdown: string;
        id?: string | undefined;
        articles_id?: string | undefined;
        meta_title?: string | null | undefined;
        meta_description?: string | null | undefined;
        canonical_url?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "review_pending" | "published" | "archived";
    slug: string;
    pillar: "psychoanalysis" | "art_calligraphy" | "cultural_strategy" | "human_rights_dadkhahi";
    content_sha256: string;
    id?: string | undefined;
    cover_image_id?: string | null | undefined;
    audio_summary_file_id?: string | null | undefined;
    embedding?: number[] | null | undefined;
    published_at?: string | null | undefined;
    translations?: {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        executive_summary: string;
        body_markdown: string;
        id?: string | undefined;
        articles_id?: string | undefined;
        meta_title?: string | null | undefined;
        meta_description?: string | null | undefined;
        canonical_url?: string | null | undefined;
    }[] | undefined;
}, {
    slug: string;
    pillar: "psychoanalysis" | "art_calligraphy" | "cultural_strategy" | "human_rights_dadkhahi";
    content_sha256: string;
    id?: string | undefined;
    status?: "draft" | "review_pending" | "published" | "archived" | undefined;
    cover_image_id?: string | null | undefined;
    audio_summary_file_id?: string | null | undefined;
    embedding?: number[] | null | undefined;
    published_at?: string | null | undefined;
    translations?: {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        executive_summary: string;
        body_markdown: string;
        id?: string | undefined;
        articles_id?: string | undefined;
        meta_title?: string | null | undefined;
        meta_description?: string | null | undefined;
        canonical_url?: string | null | undefined;
    }[] | undefined;
}>;
export type ArticleInput = z.infer<typeof ArticleSchema>;
//# sourceMappingURL=article.schema.d.ts.map