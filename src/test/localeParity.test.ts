import fs from 'fs';
import path from 'path';

// Every namespace must have the same keys, and the same {{placeholders}}, in every interface language. A string
// added in English alone would silently show English to Sinhala and Tamil readers.
const localesDir = path.join(__dirname, '..', 'i18n', 'locales');
const languages = ['en', 'si', 'ta'] as const;
const namespaces = fs.readdirSync(path.join(localesDir, 'en')).map((file) => file.replace('.json', ''));

type Json = { [key: string]: Json | string };

function flatten(value: Json, prefix = ''): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((out, [key, child]) => {
    if (typeof child === 'string') out[`${prefix}${key}`] = child;
    else Object.assign(out, flatten(child, `${prefix}${key}.`));
    return out;
  }, {});
}

const load = (language: string, namespace: string) =>
  flatten(JSON.parse(fs.readFileSync(path.join(localesDir, language, `${namespace}.json`), 'utf8')) as Json);
const placeholders = (text: string) => (text.match(/{{\w+}}/g) ?? []).sort();

describe('interface languages stay in step', () => {
  it('has the same namespaces in every language', () => {
    for (const language of languages) {
      expect(fs.readdirSync(path.join(localesDir, language)).sort()).toEqual(fs.readdirSync(path.join(localesDir, 'en')).sort());
    }
  });

  it.each(namespaces)('%s: same keys and placeholders in English, Sinhala and Tamil', (namespace) => {
    const reference = load('en', namespace);
    for (const language of ['si', 'ta']) {
      const translated = load(language, namespace);
      expect(Object.keys(translated).sort()).toEqual(Object.keys(reference).sort());
      for (const key of Object.keys(reference)) {
        expect({ key, placeholders: placeholders(translated[key] ?? '') }).toEqual({ key, placeholders: placeholders(reference[key] ?? '') });
      }
    }
  });
});
