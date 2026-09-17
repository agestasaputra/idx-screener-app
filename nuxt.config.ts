const ENVIRONMENT = process.env.APP_STAGE || "development";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CONFIGENVIRONMENT = require(
  `./configs/${ENVIRONMENT.toLowerCase()}.json`,
);

const IS_TEST = process.env.TEST === "true";
const { maMelilitThresholdPct, defaultBars } = CONFIGENVIRONMENT.env;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  css: ["~/assets/css/theme.css"],

  components: [
    { path: "~~/common/components/", prefix: "Common" },
    { path: "~~/features/screener/components/", prefix: "Screener" },
  ],

  imports: {
    dirs: [
      "~~/common/composables/**",
      "~~/common/utils/**",
      "~~/features/screener/composables/**",
    ],
  },

  modules: [
    "@pinia/nuxt",
    ...(IS_TEST ? ["@nuxt/test-utils/module" as const] : []),
    "@vueuse/nuxt",
  ],

  runtimeConfig: {
    public: {
      maMelilitThresholdPct,
      defaultBars,
    },
  },

  nitro: {
    // Memaksa Nitro memasukkan module xlsx langsung ke dalam bundel server
    externals: {
      inline: ["xlsx"],
    },
  },
});
