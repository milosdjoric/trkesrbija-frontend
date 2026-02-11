import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

// Helper to verify auth from cookie/header (simplified - you may want to add real auth check)
const auth = async (req: Request) => {
  // For now, we'll check if there's an authorization header
  // In production, verify the JWT token
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  // Extract user info from token (simplified)
  // You should verify the JWT here
  return { id: 'user', role: 'ADMIN' }
}

export const ourFileRouter = {
  // Image uploader for event main images
  eventImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      if (!user || user.role !== 'ADMIN') {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Event image upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),

  // Gallery images (multiple)
  galleryImages: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      if (!user || user.role !== 'ADMIN') {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Gallery image upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),

  // GPX file uploader for race routes
  gpxFile: f({
    'application/gpx+xml': { maxFileSize: '8MB', maxFileCount: 1 },
    'text/xml': { maxFileSize: '8MB', maxFileCount: 1 },
    blob: { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      if (!user || user.role !== 'ADMIN') {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('GPX file upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),

  // Profile image for users
  profileImage: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      if (!user) {
        throw new UploadThingError('Unauthorized')
      }
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Profile image upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
