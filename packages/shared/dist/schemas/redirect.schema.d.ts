import { z } from 'zod';
export declare const LegacyRedirectSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    source_path: z.ZodString;
    target_path: z.ZodString;
    status_code: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<308>]>>;
    hit_count: z.ZodDefault<z.ZodNumber>;
    last_accessed_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    source_path: string;
    target_path: string;
    status_code: 301 | 308;
    hit_count: number;
    id?: string | undefined;
    last_accessed_at?: string | null | undefined;
}, {
    source_path: string;
    target_path: string;
    id?: string | undefined;
    status_code?: 301 | 308 | undefined;
    hit_count?: number | undefined;
    last_accessed_at?: string | null | undefined;
}>;
export type LegacyRedirectInput = z.infer<typeof LegacyRedirectSchema>;
//# sourceMappingURL=redirect.schema.d.ts.map