import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

// Note: Auth is handled on the frontend (admin pages are protected)
// For additional security, you can verify JWT from cookies here

export const ourFileRouter = {
  // Image uploader for event main images
  eventImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      // Auth is handled by admin page protection
      return { uploadedBy: 'admin' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Event image upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),

  // Gallery images (multiple)
  galleryImages: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async () => {
      return { uploadedBy: 'admin' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Gallery image upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),

  // GPX file uploader for race routes
  // Using blob to accept any file type since GPX MIME types vary by OS
  gpxFile: f({
    blob: { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      return { uploadedBy: 'admin' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('GPX file upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),

  // Profile image for users
  profileImage: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async () => {
      return { uploadedBy: 'user' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Profile image upload complete:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
