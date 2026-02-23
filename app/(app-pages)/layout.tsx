import DashboardLayout from "./dashboard-layout"

// All pages under (app-pages) require auth — skip prerendering
// to avoid Clerk key validation failures in CI
export const dynamic = "force-dynamic"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
