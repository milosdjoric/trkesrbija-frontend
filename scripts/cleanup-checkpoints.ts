/**
 * Script to delete all checkpoints and unassign all judges
 * Run with: npx tsx scripts/cleanup-checkpoints.ts
 *
 * Requires ADMIN_ACCESS_TOKEN environment variable
 */

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'
const ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN

if (!ACCESS_TOKEN) {
  console.error('❌ ADMIN_ACCESS_TOKEN environment variable is required')
  console.log('Usage: ADMIN_ACCESS_TOKEN=your_token npx tsx scripts/cleanup-checkpoints.ts')
  process.exit(1)
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }
  return json.data
}

// Get all races to find checkpoints
const ALL_RACES_QUERY = `
  query AllRaces {
    races(limit: 1000) {
      id
      raceName
    }
  }
`

// Get checkpoints with judges for a race
const CHECKPOINTS_QUERY = `
  query Checkpoints($raceId: ID!) {
    checkpoints(raceId: $raceId) {
      id
      name
      assignedJudges {
        id
        email
      }
    }
  }
`

// Get all users to find judges
const USERS_QUERY = `
  query Users {
    users(limit: 1000) {
      id
      email
      assignedCheckpointId
    }
  }
`

const UNASSIGN_JUDGE_MUTATION = `
  mutation UnassignJudge($userId: ID!) {
    unassignJudge(userId: $userId) {
      id
      email
    }
  }
`

const DELETE_CHECKPOINT_MUTATION = `
  mutation DeleteCheckpoint($checkpointId: ID!) {
    deleteCheckpoint(checkpointId: $checkpointId)
  }
`

async function main() {
  console.log('🔄 Starting cleanup...\n')

  // Step 1: Get all races
  console.log('📋 Fetching all races...')
  const racesData = await gql<{ races: Array<{ id: string; raceName: string | null }> }>(ALL_RACES_QUERY)
  const races = racesData.races ?? []
  console.log(`   Found ${races.length} races\n`)

  // Step 2: Get all users with assigned checkpoints
  console.log('👥 Fetching users with assigned checkpoints...')
  const usersData = await gql<{ users: Array<{ id: string; email: string; assignedCheckpointId: string | null }> }>(USERS_QUERY)
  const assignedJudges = (usersData.users ?? []).filter(u => u.assignedCheckpointId)
  console.log(`   Found ${assignedJudges.length} judges with assignments\n`)

  // Step 3: Unassign all judges
  if (assignedJudges.length > 0) {
    console.log('🔓 Unassigning judges...')
    for (const judge of assignedJudges) {
      try {
        await gql(UNASSIGN_JUDGE_MUTATION, { userId: judge.id })
        console.log(`   ✓ Unassigned: ${judge.email}`)
      } catch (err: any) {
        console.log(`   ✗ Failed to unassign ${judge.email}: ${err.message}`)
      }
    }
    console.log('')
  }

  // Step 4: Delete all checkpoints from all races
  let totalCheckpoints = 0
  let deletedCheckpoints = 0

  for (const race of races) {
    const checkpointsData = await gql<{ checkpoints: Array<{ id: string; name: string }> }>(
      CHECKPOINTS_QUERY,
      { raceId: race.id }
    )
    const checkpoints = checkpointsData.checkpoints ?? []

    if (checkpoints.length > 0) {
      console.log(`🏁 Race: ${race.raceName ?? race.id} (${checkpoints.length} checkpoints)`)
      totalCheckpoints += checkpoints.length

      for (const cp of checkpoints) {
        try {
          await gql(DELETE_CHECKPOINT_MUTATION, { checkpointId: cp.id })
          console.log(`   ✓ Deleted: ${cp.name}`)
          deletedCheckpoints++
        } catch (err: any) {
          console.log(`   ✗ Failed to delete ${cp.name}: ${err.message}`)
        }
      }
    }
  }

  console.log('\n✅ Cleanup complete!')
  console.log(`   Judges unassigned: ${assignedJudges.length}`)
  console.log(`   Checkpoints deleted: ${deletedCheckpoints}/${totalCheckpoints}`)
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
