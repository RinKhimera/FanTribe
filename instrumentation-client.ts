import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://886dd0ffbb09d6274623fa89c7baa950@o4510410010787842.ingest.us.sentry.io/4510565138759680",
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
    }),
  ],
  tracesSampleRate: 1,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
