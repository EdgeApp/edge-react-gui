/**
 * Find image/SVG assets under src/assets that are not imported from any src file.
 *
 * Usage: node -r sucrase/register ./scripts/findUnusedImages.ts
 */
import fs from 'fs'
import path, { join } from 'path'

const ROOT = join(__dirname, '..')
const ASSET_ROOT = join(ROOT, 'src/assets')
const SRC_ROOT = join(ROOT, 'src')
const OUT = join(ROOT, 'docs/apkUnusedImages.json')

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
const SRC_EXTS = ['.ts', '.tsx', '.js', '.jsx']

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === '__tests__' || ent.name === 'node_modules') continue
      walk(p, exts, out)
    } else if (exts.some(e => ent.name.toLowerCase().endsWith(e))) {
      if (ent.name.includes('.test.') || ent.name.includes('.spec.')) continue
      out.push(p)
    }
  }
  return out
}

function stripDensity(p: string): string {
  return p.replace(/@[23]x(-light)?(?=\.[^.]+$)/, '')
}

function main(): void {
  const images = walk(ASSET_ROOT, IMAGE_EXTS)
  const srcFiles = walk(SRC_ROOT, SRC_EXTS)

  const importRe =
    /(?:from|require\()\s*['"`]([^'"`]+?\.(?:png|jpg|jpeg|gif|webp|svg))['"`]/g
  const referenced = new Set<string>()

  for (const f of srcFiles) {
    const text = fs.readFileSync(f, 'utf8')
    let m: RegExpExecArray | null
    importRe.lastIndex = 0
    while ((m = importRe.exec(text)) != null) {
      const rel = m[1]
      if (rel.startsWith('.')) {
        referenced.add(path.normalize(join(path.dirname(f), rel)))
      }
    }
  }

  const referencedBases = new Set([...referenced].map(stripDensity))

  const unused: Array<{ path: string; size: number }> = []
  let unusedBytes = 0
  for (const img of images) {
    const norm = path.normalize(img)
    const base = stripDensity(norm)
    const used = referenced.has(norm) || referencedBases.has(base)
    if (!used) {
      const size = fs.statSync(img).size
      unused.push({ path: path.relative(ROOT, img), size })
      unusedBytes += size
    }
  }
  unused.sort((a, b) => b.size - a.size)

  const report = {
    generatedAt: new Date().toISOString(),
    totalImages: images.length,
    referencedImports: referenced.size,
    unusedCount: unused.length,
    unusedBytes,
    unused
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n')
  console.log(
    `Unused images: ${unused.length} / ${images.length} (${(
      unusedBytes /
      1024 /
      1024
    ).toFixed(2)} MB on disk)`
  )
  for (const u of unused.slice(0, 25)) {
    console.log(`  ${(u.size / 1024).toFixed(1).padStart(8)} KB  ${u.path}`)
  }
  console.log(`Wrote ${OUT}`)
}

main()
