import { z } from 'zod';
export const LegacyRedirectSchema = z.object({
    id: z.string().uuid().optional(),
    source_path: z.string().min(1).max(500),
    target_path: z.string().min(1).max(500),
    status_code: z.union([z.literal(301), z.literal(308)]).default(301),
    hit_count: z.number().int().nonnegative().default(0),
    last_accessed_at: z.string().datetime().nullable().optional(),
});
//# sourceMappingURL=redirect.schema.js.map