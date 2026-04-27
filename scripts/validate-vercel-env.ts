#!/usr/bin/env bun
/**
 * Valide que chaque environnement Vercel (preview, production) contient
 * toutes les clés requises par les schémas Zod côté serveur ET client.
 *
 * Reproduit l'échec de build Vercel localement, avant push.
 *
 * Usage:
 *   bun scripts/validate-vercel-env.ts                # preview + production
 *   bun scripts/validate-vercel-env.ts development    # un seul target
 *
 * Le script échoue (exit 1) si une clé requise est absente sur Vercel.
 * Si la CLI Vercel n'est pas authentifiée, le script affiche un avertissement
 * et exit 0 (pour ne pas bloquer un dev offline).
 */
import { execSync } from "node:child_process"
import { readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { clientEnvSchema, serverEnvSchema } from "../lib/config/env.schemas"

type Target = "development" | "preview" | "production"

const currentBranch = (): string | null => {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()
  } catch {
    return null
  }
}

const parseEnv = (content: string): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1)
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const pull = (
  target: Target,
  branch?: string,
): Record<string, string> | null => {
  const tmp = join(tmpdir(), `vercel-env-validate-${Date.now()}-${target}.env`)
  const branchFlag = branch ? ` --git-branch=${branch}` : ""
  try {
    execSync(
      `vercel env pull "${tmp}" --environment=${target}${branchFlag} --yes`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    )
    const content = readFileSync(tmp, "utf8")
    return parseEnv(content)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(
      `⚠️  vercel env pull "${target}" failed: ${msg.split("\n")[0]}`,
    )
    return null
  } finally {
    try {
      writeFileSync(tmp, "")
      unlinkSync(tmp)
    } catch {
      // ignore
    }
  }
}

const validate = (target: Target, env: Record<string, string>): string[] => {
  const errors: string[] = []
  const server = serverEnvSchema.safeParse(env)
  if (!server.success) {
    for (const issue of server.error.issues) {
      errors.push(`[server] ${issue.path.join(".")}: ${issue.message}`)
    }
  }
  const client = clientEnvSchema.safeParse(env)
  if (!client.success) {
    for (const issue of client.error.issues) {
      errors.push(`[client] ${issue.path.join(".")}: ${issue.message}`)
    }
  }
  return errors
}

const main = () => {
  const arg = process.argv[2] as Target | undefined
  const targets: Target[] = arg ? [arg] : ["preview", "production"]
  const branch = currentBranch()

  let hadFailure = false
  let pulledAny = false

  for (const target of targets) {
    // For preview, scope to the current branch so we see branch-restricted vars
    // (Vercel returns only non-branch-scoped vars otherwise).
    const useBranch = target === "preview" ? (branch ?? undefined) : undefined
    const label = useBranch ? `${target} (${useBranch})` : target
    console.log(`\n→ Validating Vercel "${label}" environment…`)
    const env = pull(target, useBranch)
    if (!env) {
      console.log(`   skipped (could not pull)`)
      continue
    }
    pulledAny = true
    const errors = validate(target, env)
    if (errors.length === 0) {
      console.log(`   ✓ all required env vars present`)
    } else {
      hadFailure = true
      console.log(`   ✗ ${errors.length} issue(s):`)
      for (const e of errors) console.log(`     - ${e}`)
    }
  }

  if (!pulledAny) {
    console.warn(
      "\n⚠️  No Vercel environment could be pulled — skipping validation.",
    )
    console.warn(
      "   Run `vercel login` and `vercel link` to enable this check.",
    )
    process.exit(0)
  }

  if (hadFailure) {
    console.error(
      "\n✗ Vercel env validation failed — fix missing keys with `vercel env add <NAME> <env>`.",
    )
    process.exit(1)
  }
  console.log("\n✓ Vercel env validation passed.")
}

main()
