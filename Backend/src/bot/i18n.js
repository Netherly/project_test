// src/bot/i18n.js
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');
const translations = {};
const supportedLanguages = [];

fs.readdirSync(localesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.split('.')[0];
    supportedLanguages.push(lang);
    const data = fs.readFileSync(path.join(localesDir, file), 'utf8');
    translations[lang] = JSON.parse(data);
  }
});

const defaultLang = 'ru';

function t(key, langCode = defaultLang, replacements = {}) {
  const lang = supportedLanguages.includes(langCode) ? langCode : defaultLang;
  let text = translations[lang]?.[key] || translations[defaultLang]?.[key] || key;

  for (const placeholder in replacements) {
    text = text.replace(new RegExp(`{{${placeholder}}}`, 'g'), replacements[placeholder]);
  }

  return text;
}

module.exports = { t };