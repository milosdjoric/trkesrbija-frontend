import Providers from '../providers'
import { ApplicationLayout } from './application-layout'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ApplicationLayout>{children}</ApplicationLayout>
    </Providers>
  )
}
