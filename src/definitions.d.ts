export type TranslationType = 'ru-be' | 'none';
export type TransliterationType = 'basic' | 'classic' | 'official' | 'none';

export interface TranslationSettings {
    translation: TranslationType;
    transliteration: TransliterationType;
}

interface WebsitesSettings {
    enabledByDefault: boolean;
    enabledFor: string[];
    disabledFor: string[];
}

export type UserSettings = TranslationSettings & WebsitesSettings;
