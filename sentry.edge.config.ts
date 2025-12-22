import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://886dd0ffbb09d6274623fa89c7baa950@o4510410010787842.ingest.us.sentry.io/4510565138759680",
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
})
