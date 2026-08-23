import { TournamentCategory } from '../types';

export const CATEGORY_NAMES: TournamentCategory[] = [
  'Solo',
  'Duo',
  'Classic Squad',
  '2v2 Lone Wolf',
  'BR Match'
];

export const CATEGORY_ALL_LIST: (TournamentCategory | 'All')[] = [
  'All',
  'Solo',
  'Duo',
  'Classic Squad',
  '2v2 Lone Wolf',
  'BR Match'
];

export const CATEGORY_TO_PARAM_MAP: Record<TournamentCategory, string> = {
  'Solo': 'SOLO',
  'Duo': 'DUO',
  'Classic Squad': 'CLASSIC_SQUAD',
  '2v2 Lone Wolf': '2V2_LONE_WOLF',
  'BR Match': 'BR_MATCH'
};

export const PARAM_TO_CATEGORY_MAP: Record<string, TournamentCategory> = {
  'SOLO': 'Solo',
  'DUO': 'Duo',
  'CLASSIC_SQUAD': 'Classic Squad',
  '2V2_LONE_WOLF': '2v2 Lone Wolf',
  'BR_MATCH': 'BR Match'
};

/**
 * Normalizes any category string or query param value to a valid TournamentCategory or 'All'
 */
export function normalizeCategory(input?: string | null): TournamentCategory | 'All' {
  if (!input) return 'All';
  
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === 'all') return 'All';

  // Format into uppercase with underscores (e.g. "classic squad" -> "CLASSIC_SQUAD")
  const slug = trimmed
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (PARAM_TO_CATEGORY_MAP[slug]) {
    return PARAM_TO_CATEGORY_MAP[slug];
  }

  // Check direct equality against standard category titles
  const directMatch = CATEGORY_NAMES.find(
    c => c.toLowerCase() === trimmed.toLowerCase() ||
         c.replace(/[\s-]+/g, '_').toLowerCase() === slug.toLowerCase()
  );
  if (directMatch) return directMatch;

  // Flexible synonyms and edge cases
  if (slug === 'SQUAD' || slug === 'CLASSICSQUAD') return 'Classic Squad';
  if (slug === '2V2' || slug === 'LONE_WOLF' || slug === 'LONEWOLF' || slug === '2V2LONEWOLF') return '2v2 Lone Wolf';
  if (slug === 'BR' || slug === 'BRMATCH' || slug === 'BATTLEROYALE' || slug === 'BATTLE_ROYALE') return 'BR Match';

  return 'All';
}

/**
 * Returns the URL query parameter slug for a category (e.g. 'Solo' -> 'SOLO')
 */
export function getCategorySlug(category: TournamentCategory | string): string {
  const norm = normalizeCategory(category);
  if (norm === 'All') return '';
  return CATEGORY_TO_PARAM_MAP[norm] || norm.toUpperCase().replace(/\s+/g, '_');
}

/**
 * Tests if a search query string matches a tournament's category
 */
export function matchesCategorySearch(category: string, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  const cat = category.toLowerCase();
  
  if (cat.includes(q)) return true;

  if (q === 'solo' && cat === 'solo') return true;
  if (q === 'duo' && cat === 'duo') return true;
  if ((q === 'squad' || q === 'classic squad') && cat.includes('squad')) return true;
  if ((q === '2v2' || q === 'lone wolf' || q === 'lonewolf') && cat.includes('lone wolf')) return true;
  if ((q === 'br' || q === 'br match' || q === 'battle royale') && (cat.includes('br') || cat.includes('battle'))) return true;

  return false;
}
