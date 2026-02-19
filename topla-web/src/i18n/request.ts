import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Default locale; can be extended with cookie/header detection
  const locale = 'uz';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
