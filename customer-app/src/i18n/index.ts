import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import af from "./locales/af";

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",

    resources: {
      en: {
        translation: en,
      },
      af: {
        translation: af,
      },
    },

    lng: "en",

    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;