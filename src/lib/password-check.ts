/**
 * Checks a password against the HaveIBeenPwned (HIBP) API using the
 * k-anonymity model: only the first 5 characters of the SHA-1 hash are
 * sent to the server. The server returns all matching hash suffixes
 * for that prefix, and we check the full hash locally.
 *
 * This provides the same protection as Supabase's built-in "Prevent
 * Leaked Passwords" setting, which is a GoTrue service-level config
 * that cannot be toggled from the database or client.
 */

async function sha1Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export interface BreachCheckResult {
  compromised: boolean
  occurrences: number
}

export async function checkPasswordBreach(
  password: string,
): Promise<BreachCheckResult> {
  const fullHash = (await sha1Hex(password)).toUpperCase()
  const prefix = fullHash.slice(0, 5)
  const suffix = fullHash.slice(5)

  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`,
  )

  if (!response.ok) {
    // If the API is unreachable, fail open — don't block the user.
    return { compromised: false, occurrences: 0 }
  }

  const text = await response.text()

  for (const line of text.split("\n")) {
    const [hashSuffix, countStr] = line.trim().split(":")
    if (hashSuffix === suffix) {
      const occurrences = parseInt(countStr, 10)
      return { compromised: true, occurrences }
    }
  }

  return { compromised: false, occurrences: 0 }
}
