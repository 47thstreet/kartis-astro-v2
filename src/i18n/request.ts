import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './routing';
export default getRequestConfig(async ({ locale }) => {
  const selected = locales.includes(locale as any) ? locale : defaultLocale;
  return { locale: selected, messages: (await import(`../messages/${selected}.json`)).default };
});
