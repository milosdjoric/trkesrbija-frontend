import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // Schema source: koristi URL running servera ili backend fajl
  // Pokrenuti backend pre codegen-a: cd ../backend && npm run dev
  schema: process.env.GRAPHQL_SCHEMA_URL || 'http://localhost:4000/graphql',
  // Scan all .ts/.tsx files for GraphQL queries/mutations
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    'src/graphql/generated/types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        // Koristi DateTime kao string (GraphQL scalar)
        scalars: {
          DateTime: 'string',
        },
        // Generiši enum-e kao TypeScript union tipove (bolje za tree-shaking)
        enumsAsTypes: true,
        // Nemoj dodavati __typename po default-u
        skipTypename: true,
        // Koristi 'Maybe' tip za nullable polja
        maybeValue: 'T | null',
      },
    },
  },
  // Ignoriši greške za queries bez operacija
  ignoreNoDocuments: true,
}

export default config
