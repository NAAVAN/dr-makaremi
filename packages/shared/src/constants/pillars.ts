import { ContentPillar } from '../types/content';

export interface PillarMeta {
  id: ContentPillar;
  titleFa: string;
  titleFr: string;
  titleEn: string;
  colorHex: string;
  badgeClass: string;
}

export const PILLARS_CONFIG: Record<ContentPillar, PillarMeta> = {
  psychoanalysis: {
    id: 'psychoanalysis',
    titleFa: 'روانکاوی لکانی',
    titleFr: 'Psychanalyse Lacanienne',
    titleEn: 'Lacanian Psychoanalysis',
    colorHex: '#0F766E', // Dark Teal
    badgeClass: 'pillar-badge-psychoanalysis',
  },
  art_calligraphy: {
    id: 'art_calligraphy',
    titleFa: 'خوشنویسی مدرن و هنر',
    titleFr: 'Calligraphie Moderne & Art',
    titleEn: 'Modern Calligraphy & Art',
    colorHex: '#1E3A8A', // Persian Lapis Blue
    badgeClass: 'pillar-badge-art',
  },
  cultural_strategy: {
    id: 'cultural_strategy',
    titleFa: 'استراتژی فرهنگی و سیاسی',
    titleFr: 'Stratégie Culturelle & Politique',
    titleEn: 'Cultural & Political Strategy',
    colorHex: '#B45309', // Ochre Gold
    badgeClass: 'pillar-badge-strategy',
  },
  human_rights_dadkhahi: {
    id: 'human_rights_dadkhahi',
    titleFa: 'حقوق بشر و دادخواهی',
    titleFr: "Droits de l'Homme & Justice Transitionnelle",
    titleEn: 'Human Rights & Transitional Justice',
    colorHex: '#991B1B', // Deep Crimson
    badgeClass: 'pillar-badge-rights',
  },
};
