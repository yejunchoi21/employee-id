import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const STACK_SYS = ['alignItems', 'flexWrap', 'justifyContent', 'minWidth']
const TYPO_SYS = ['display', 'fontWeight']

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, files)
    else if (p.endsWith('.tsx')) files.push(p)
  }
  return files
}

function parseJsxValue(source, start) {
  const ch = source[start]
  if (ch === '"' || ch === "'") {
    const q = ch
    let i = start + 1
    while (i < source.length && source[i] !== q) {
      if (source[i] === '\\') i++
      i++
    }
    return { value: source.slice(start, i + 1), end: i + 1 }
  }
  if (ch === '{') {
    let depth = 0
    for (let i = start; i < source.length; i++) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') {
        depth--
        if (depth === 0) return { value: source.slice(start, i + 1), end: i + 1 }
      }
    }
  }
  return null
}

function toSxEntry(name, rawValue) {
  if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
    return `${name}: ${rawValue}`
  }
  if (rawValue.startsWith('{') && rawValue.endsWith('}')) {
    return `${name}: ${rawValue.slice(1, -1).trim()}`
  }
  return `${name}: ${rawValue}`
}

function patchTag(source, tag, sysNames) {
  let result = ''
  let i = 0
  const needle = `<${tag}`
  while (i < source.length) {
    const open = source.indexOf(needle, i)
    if (open === -1) {
      result += source.slice(i)
      break
    }
    result += source.slice(i, open)
    let j = open + needle.length
    if (source[j] !== ' ' && source[j] !== '>' && source[j] !== '/') {
      result += source[open]
      i = open + 1
      continue
    }
    const sys = {}
    let sxValue = null
    const other = []
    const tagStart = j
    while (j < source.length) {
      while (j < source.length && /\s/.test(source[j])) j++
      if (source[j] === '/' && source[j + 1] === '>') {
        j += 2
        break
      }
      if (source[j] === '>') {
        j++
        break
      }
      const nm = source.slice(j).match(/^(\w+)=/)
      if (!nm) {
        j++
        continue
      }
      const attr = nm[1]
      j += nm[0].length
      const parsed = parseJsxValue(source, j)
      if (!parsed) break
      j = parsed.end
      if (sysNames.includes(attr)) sys[attr] = parsed.value
      else if (attr === 'sx') sxValue = parsed.value
      else other.push(`${attr}=${parsed.value}`)
    }

    if (Object.keys(sys).length === 0) {
      result += source.slice(open, j)
      i = j
      continue
    }

    const sysInner = Object.entries(sys)
      .map(([k, v]) => toSxEntry(k, v))
      .join(', ')
    let sxContent
    if (sxValue) {
      const inner = sxValue.slice(1, -1).trim()
      sxContent = inner ? `${inner}, ${sysInner}` : sysInner
    } else {
      sxContent = sysInner
    }

    const selfClosing = source[j - 2] === '/' && source[j - 1] === '>'
    result += `<${tag}`
    if (other.length) result += ` ${other.join(' ')}`
    result += ` sx={{ ${sxContent} }}`
    result += selfClosing ? ' />' : '>'
    i = j
  }
  return result
}

function patchFile(path) {
  let s = readFileSync(path, 'utf8')
  const orig = s
  s = s.replace(/inputProps=\{\{([^}]+)\}\}/g, 'slotProps={{ htmlInput: { $1 } }}')
  s = patchTag(s, 'Stack', STACK_SYS)
  s = patchTag(s, 'Typography', TYPO_SYS)
  if (s !== orig) writeFileSync(path, s, 'utf8')
}

for (const f of walk(SRC)) patchFile(f)