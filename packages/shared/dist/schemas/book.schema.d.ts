import { z } from 'zod';
export declare const BookGeoLinkSchema: z.ZodObject<{
    platform: z.ZodString;
    url: z.ZodString;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    platform: string;
    url: string;
    label: string;
}, {
    platform: string;
    url: string;
    label: string;
}>;
export declare const BookTranslationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    books_id: z.ZodOptional<z.ZodString>;
    languages_code: z.ZodEnum<["fa-IR", "fr-FR", "en-US"]>;
    title: z.ZodString;
    subtitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    publisher_name: z.ZodString;
    publication_city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    synopsis: z.ZodString;
    table_of_contents_markdown: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sample_chapter_markdown: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sample_flipbook_pdf_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    geo_acquisition_links: z.ZodDefault<z.ZodObject<{
        iran: z.ZodDefault<z.ZodArray<z.ZodObject<{
            platform: z.ZodString;
            url: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            platform: string;
            url: string;
            label: string;
        }, {
            platform: string;
            url: string;
            label: string;
        }>, "many">>;
        international: z.ZodDefault<z.ZodArray<z.ZodObject<{
            platform: z.ZodString;
            url: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            platform: string;
            url: string;
            label: string;
        }, {
            platform: string;
            url: string;
            label: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        iran: {
            platform: string;
            url: string;
            label: string;
        }[];
        international: {
            platform: string;
            url: string;
            label: string;
        }[];
    }, {
        iran?: {
            platform: string;
            url: string;
            label: string;
        }[] | undefined;
        international?: {
            platform: string;
            url: string;
            label: string;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    languages_code: "fa-IR" | "fr-FR" | "en-US";
    title: string;
    publisher_name: string;
    synopsis: string;
    geo_acquisition_links: {
        iran: {
            platform: string;
            url: string;
            label: string;
        }[];
        international: {
            platform: string;
            url: string;
            label: string;
        }[];
    };
    id?: string | undefined;
    books_id?: string | undefined;
    subtitle?: string | null | undefined;
    publication_city?: string | null | undefined;
    table_of_contents_markdown?: string | null | undefined;
    sample_chapter_markdown?: string | null | undefined;
    sample_flipbook_pdf_id?: string | null | undefined;
}, {
    languages_code: "fa-IR" | "fr-FR" | "en-US";
    title: string;
    publisher_name: string;
    synopsis: string;
    id?: string | undefined;
    books_id?: string | undefined;
    subtitle?: string | null | undefined;
    publication_city?: string | null | undefined;
    table_of_contents_markdown?: string | null | undefined;
    sample_chapter_markdown?: string | null | undefined;
    sample_flipbook_pdf_id?: string | null | undefined;
    geo_acquisition_links?: {
        iran?: {
            platform: string;
            url: string;
            label: string;
        }[] | undefined;
        international?: {
            platform: string;
            url: string;
            label: string;
        }[] | undefined;
    } | undefined;
}>;
export declare const BookSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    isbn_13: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    publication_year: z.ZodNumber;
    page_count: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    pillar: z.ZodEnum<["psychoanalysis", "art_calligraphy", "cultural_strategy", "human_rights_dadkhahi"]>;
    cover_3d_front_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    cover_3d_spine_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    cover_3d_back_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    author_audio_commentary_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    order_index: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published", "archived"]>>;
    translations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        books_id: z.ZodOptional<z.ZodString>;
        languages_code: z.ZodEnum<["fa-IR", "fr-FR", "en-US"]>;
        title: z.ZodString;
        subtitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        publisher_name: z.ZodString;
        publication_city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        synopsis: z.ZodString;
        table_of_contents_markdown: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sample_chapter_markdown: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sample_flipbook_pdf_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        geo_acquisition_links: z.ZodDefault<z.ZodObject<{
            iran: z.ZodDefault<z.ZodArray<z.ZodObject<{
                platform: z.ZodString;
                url: z.ZodString;
                label: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                platform: string;
                url: string;
                label: string;
            }, {
                platform: string;
                url: string;
                label: string;
            }>, "many">>;
            international: z.ZodDefault<z.ZodArray<z.ZodObject<{
                platform: z.ZodString;
                url: z.ZodString;
                label: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                platform: string;
                url: string;
                label: string;
            }, {
                platform: string;
                url: string;
                label: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            iran: {
                platform: string;
                url: string;
                label: string;
            }[];
            international: {
                platform: string;
                url: string;
                label: string;
            }[];
        }, {
            iran?: {
                platform: string;
                url: string;
                label: string;
            }[] | undefined;
            international?: {
                platform: string;
                url: string;
                label: string;
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        publisher_name: string;
        synopsis: string;
        geo_acquisition_links: {
            iran: {
                platform: string;
                url: string;
                label: string;
            }[];
            international: {
                platform: string;
                url: string;
                label: string;
            }[];
        };
        id?: string | undefined;
        books_id?: string | undefined;
        subtitle?: string | null | undefined;
        publication_city?: string | null | undefined;
        table_of_contents_markdown?: string | null | undefined;
        sample_chapter_markdown?: string | null | undefined;
        sample_flipbook_pdf_id?: string | null | undefined;
    }, {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        publisher_name: string;
        synopsis: string;
        id?: string | undefined;
        books_id?: string | undefined;
        subtitle?: string | null | undefined;
        publication_city?: string | null | undefined;
        table_of_contents_markdown?: string | null | undefined;
        sample_chapter_markdown?: string | null | undefined;
        sample_flipbook_pdf_id?: string | null | undefined;
        geo_acquisition_links?: {
            iran?: {
                platform: string;
                url: string;
                label: string;
            }[] | undefined;
            international?: {
                platform: string;
                url: string;
                label: string;
            }[] | undefined;
        } | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "published" | "archived";
    slug: string;
    pillar: "psychoanalysis" | "art_calligraphy" | "cultural_strategy" | "human_rights_dadkhahi";
    publication_year: number;
    order_index: number;
    id?: string | undefined;
    translations?: {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        publisher_name: string;
        synopsis: string;
        geo_acquisition_links: {
            iran: {
                platform: string;
                url: string;
                label: string;
            }[];
            international: {
                platform: string;
                url: string;
                label: string;
            }[];
        };
        id?: string | undefined;
        books_id?: string | undefined;
        subtitle?: string | null | undefined;
        publication_city?: string | null | undefined;
        table_of_contents_markdown?: string | null | undefined;
        sample_chapter_markdown?: string | null | undefined;
        sample_flipbook_pdf_id?: string | null | undefined;
    }[] | undefined;
    isbn_13?: string | null | undefined;
    page_count?: number | null | undefined;
    cover_3d_front_id?: string | null | undefined;
    cover_3d_spine_id?: string | null | undefined;
    cover_3d_back_id?: string | null | undefined;
    author_audio_commentary_id?: string | null | undefined;
}, {
    slug: string;
    pillar: "psychoanalysis" | "art_calligraphy" | "cultural_strategy" | "human_rights_dadkhahi";
    publication_year: number;
    id?: string | undefined;
    status?: "draft" | "published" | "archived" | undefined;
    translations?: {
        languages_code: "fa-IR" | "fr-FR" | "en-US";
        title: string;
        publisher_name: string;
        synopsis: string;
        id?: string | undefined;
        books_id?: string | undefined;
        subtitle?: string | null | undefined;
        publication_city?: string | null | undefined;
        table_of_contents_markdown?: string | null | undefined;
        sample_chapter_markdown?: string | null | undefined;
        sample_flipbook_pdf_id?: string | null | undefined;
        geo_acquisition_links?: {
            iran?: {
                platform: string;
                url: string;
                label: string;
            }[] | undefined;
            international?: {
                platform: string;
                url: string;
                label: string;
            }[] | undefined;
        } | undefined;
    }[] | undefined;
    isbn_13?: string | null | undefined;
    page_count?: number | null | undefined;
    cover_3d_front_id?: string | null | undefined;
    cover_3d_spine_id?: string | null | undefined;
    cover_3d_back_id?: string | null | undefined;
    author_audio_commentary_id?: string | null | undefined;
    order_index?: number | undefined;
}>;
export type BookInput = z.infer<typeof BookSchema>;
//# sourceMappingURL=book.schema.d.ts.map