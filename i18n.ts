import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const languages = [
  {
    code: 'en-US',
    lang: 'en',
    label: 'English',
  },
  {
    code: 'zh-CN',
    lang: 'cn',
    label: '简体中文',
  },
  {
    code: 'zh-TW',
    lang: 'tw',
    label: '繁體中文',
  },
  {
    code: 'ja-JP',
    lang: 'jp',
    label: '日本語',
  },
  {
    code: 'ko-KR',
    lang: 'kr',
    label: '한국어',
  },
  {
    code: 'ru-RU',
    lang: 'ru',
    label: 'Русский',
  },
  {
    code: 'pt-BR',
    lang: 'pt',
    label: 'Português',
  },
  {
    code: 'es-ES',
    lang: 'es',
    label: 'Español',
  },
  {
    code: 'de-DE',
    lang: 'de',
    label: 'Deutsch',
  },
  {
    code: 'fr-FR',
    lang: 'fr',
    label: 'Français',
  },
  {
    code: 'vi-VN',
    lang: 'vn',
    label: 'Tiếng Việt',
  },
  {
    code: 'ar-SA',
    lang: 'ar',
    label: 'العربية',
  },
  {
    code: 'nl-NL',
    lang: 'nl',
    label: 'Nederlands',
  },
  {
    code: 'pl-PL',
    lang: 'pl',
    label: 'Polski',
  },
];

export const locales = languages.map((lang) => lang.lang);

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
