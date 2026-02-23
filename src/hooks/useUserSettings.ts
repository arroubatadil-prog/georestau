import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types';

type Lang = 'fr' | 'en' | 'ar';
type Theme = 'light' | 'dark';

interface UserSettings {
  lang: Lang;
  theme: Theme;
}

const DEFAULT_SETTINGS: UserSettings = {
  lang: 'fr',
  theme: 'dark',
};

/**
 * Hook pour gérer les paramètres utilisateur indépendamment pour CLIENT et CHEF
 * Les paramètres sont stockés séparément: 'client_lang', 'client_theme', 'chef_lang', 'chef_theme'
 */
export const useUserSettings = (role: UserRole | null) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Générer la clé de stockage basée sur le rôle
  const getStorageKey = (key: string): string => {
    if (!role) return key;
    const prefix = role === UserRole.CLIENT ? 'client_' : 'chef_';
    return prefix + key;
  };

  // Charger les paramètres au démarrage
  useEffect(() => {
    try {
      const langKey = getStorageKey('lang');
      const themeKey = getStorageKey('theme');

      const savedLang = (localStorage.getItem(langKey) as Lang) || DEFAULT_SETTINGS.lang;
      const savedTheme = (localStorage.getItem(themeKey) as Theme) || DEFAULT_SETTINGS.theme;

      setSettings({
        lang: savedLang,
        theme: savedTheme,
      });
      setIsLoaded(true);
    } catch (e) {
      console.warn('Error loading user settings:', e);
      setIsLoaded(true);
    }
  }, [role]);

  // Sauvegarder la langue
  const setLang = useCallback((lang: Lang) => {
    try {
      const langKey = getStorageKey('lang');
      localStorage.setItem(langKey, lang);
      setSettings(prev => ({ ...prev, lang }));
    } catch (e) {
      console.warn('Error saving language:', e);
    }
  }, [role]);

  // Sauvegarder le thème
  const setTheme = useCallback((theme: Theme) => {
    try {
      const themeKey = getStorageKey('theme');
      localStorage.setItem(themeKey, theme);
      setSettings(prev => ({ ...prev, theme }));
    } catch (e) {
      console.warn('Error saving theme:', e);
    }
  }, [role]);

  return {
    lang: settings.lang,
    theme: settings.theme,
    setLang,
    setTheme,
    isLoaded,
  };
};
