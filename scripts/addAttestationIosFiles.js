// One-off helper: wire the EdgeAttestation native files into the iOS Xcode
// project (PBXBuildFile + PBXFileReference + group + Sources build phase) for
// the `edge` target. Idempotent. Run with: node scripts/addAttestationIosFiles.js
const fs = require('fs')
const xcode = require('xcode')

const projPath = 'ios/edge.xcodeproj/project.pbxproj'
const proj = xcode.project(projPath)
proj.parseSync()

const unquote = s => (typeof s === 'string' ? s.replace(/^"|"$/g, '') : s)

// Locate the `edge` native target (not `edgeTests`).
const targets = proj.pbxNativeTargetSection()
let edgeTargetKey
for (const key of Object.keys(targets)) {
  if (key.endsWith('_comment')) continue
  if (unquote(targets[key].name) === 'edge') {
    edgeTargetKey = key
    break
  }
}
if (edgeTargetKey == null) throw new Error('Could not find the `edge` target')

const groupKey = proj.findPBXGroupKey({ name: 'edge' })
if (groupKey == null) throw new Error('Could not find the `edge` group')

const fileRefs = proj.pbxFileReferenceSection()
const isPresent = relPath =>
  Object.keys(fileRefs).some(
    k => !k.endsWith('_comment') && unquote(fileRefs[k].path) === relPath
  )

for (const relPath of [
  'edge/EdgeAttestation.swift',
  'edge/EdgeAttestation.m'
]) {
  if (isPresent(relPath)) {
    console.log('already present:', relPath)
    continue
  }
  proj.addSourceFile(relPath, { target: edgeTargetKey }, groupKey)
  console.log('added:', relPath)
}

fs.writeFileSync(projPath, proj.writeSync())
console.log('wrote', projPath)
