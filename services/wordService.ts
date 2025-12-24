import { WORD_LISTS } from '../constants';
import { WordPair } from '../types';

const STORAGE_KEY = 'impostor_used_words_v2';

interface UsedWords {
  [themeId: string]: string[]; // Stores the 'normal' word to avoid repeating pairs
}

const getUsedWords = (): UsedWords => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveUsedWords = (history: UsedWords) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const getGameWords = (selectedThemeIds: string[]): { secretWord: string, undercoverWord: string, themeLabel: string } => {
  // 1. Combine lists from all selected themes
  let pool: { pair: WordPair, themeId: string }[] = [];
  
  selectedThemeIds.forEach(themeId => {
    if (WORD_LISTS[themeId]) {
      WORD_LISTS[themeId].forEach(pair => {
        pool.push({ pair, themeId });
      });
    }
  });

  // If pool is empty (fallback), use Argentina
  if (pool.length === 0) {
     WORD_LISTS['argentina'].forEach(pair => pool.push({ pair, themeId: 'argentina' }));
  }

  // 2. Filter used words
  const history = getUsedWords();
  
  // Filter available pairs where the 'normal' word hasn't been used in that theme
  let available = pool.filter(item => {
    const themeHistory = history[item.themeId] || [];
    return !themeHistory.includes(item.pair.normal);
  });

  // Reset if exhausted
  if (available.length === 0) {
    available = [...pool];
    // We ideally reset history for involved themes, but simpler to just use pool
    // Not strictly resetting the storage to avoid clearing unselected themes data
  }

  // 3. Pick Random
  const selection = available[Math.floor(Math.random() * available.length)];
  
  // 4. Save to history
  if (!history[selection.themeId]) history[selection.themeId] = [];
  history[selection.themeId].push(selection.pair.normal);
  saveUsedWords(history);

  // 5. Randomize who gets which word? 
  // No, let's keep 'normal' as majority and 'undercover' as the spy word.
  // But maybe sometimes swap them so "Fernet" isn't always the majority if played again?
  // For now, consistent: Normal is Citizen, Undercover is Spy.
  
  return {
    secretWord: selection.pair.normal,
    undercoverWord: selection.pair.undercover,
    themeLabel: selection.themeId // Or lookup friendly label
  };
};