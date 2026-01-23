import { getEvents } from '@/data'
import Providers from '../providers'
import { ApplicationLayout } from './application-layout'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let events = await getEvents()

  return (
    <Providers>
      <ApplicationLayout events={events}>{children}</ApplicationLayout>
    </Providers>
  )
}
