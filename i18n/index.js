const ru = require('./ru.json');
const uz = require('./uz.json');

const translations = {
  ru,
  uz
};

// Get translation based on language from request headers
const t = (req, key) => {
  // Get language from Accept-Language header or default to 'ru'
  const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'ru';
  const language = ['ru', 'uz'].includes(lang) ? lang : 'ru';

  const keys = key.split('.');
  let value = translations[language];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
};

module.exports = { t };
