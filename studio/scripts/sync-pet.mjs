/**
 * 把 dsh-pet-only 的构建产物从源码树同步到 studio 实际运行的冻结副本。
 *
 * 为什么需要它：
 * - 网页版与桌面版加载的都是 `studio/vendor/dsh-pet-only/`（profile 依赖指向它，node_modules 是 hardlink）；
 * - 代码却改在 `studio/vendor/dsh-pet-src/dsh-pet-only/`（源码树）；
 * - 两边是各自独立的目录，源码树的改动不会自动流过去——不同步就会「一个版本生效、另一个没反应」。
 *
 * 同步范围：
 * - `lib/`：网页版客户端 + 宿主（含对话、气泡逻辑），由 tsdown 构建；
 * - `runtime/electron-helper/`：桌面渲染进程（气泡 DOM/CSS、命中区），手写 JS/HTML 不经打包。
 *
 * 用法：
 *   node studio/scripts/sync-pet.mjs              # 构建 + 同步
 *   node studio/scripts/sync-pet.mjs --no-build   # 只同步（已手动构建过）
 *
 * 回滚：目标目录上一份备份在 `lib.bak-sync` / `runtime/electron-helper.bak-sync`。
 */
import { cpSync, existsSync, linkSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const studio = join(here, '..');
const srcRoot = join(studio, 'vendor', 'dsh-pet-src', 'dsh-pet-only');
const pkgRoot = join(studio, 'vendor', 'dsh-pet-only');
const profileRoot = join(studio, '..', '.dsh-home', 'profiles', 'studio', 'node_modules', 'dsh-pet-only');

/** 同步的产物目录（相对包根）。 */
const PARTS = ['lib', join('runtime', 'electron-helper')];

/** 备份目标目录后覆盖复制。不删目标里的多余文件：lib 下可能留有补丁的 .bak，删掉会丢回滚点。 */
function backupThenReplace(src, dest) {
  const backup = dest + '.bak-sync';
  rmSync(backup, { recursive: true, force: true });
  cpSync(dest, backup, { recursive: true });
  try {
    cpSync(src, dest, { recursive: true, force: true });
  } catch (e) {
    rmSync(dest, { recursive: true, force: true });
    cpSync(backup, dest, { recursive: true });
    throw e;
  }
}

/** 把 from 逐个文件硬链到 to：保持 vendor ↔ node_modules 的硬链接关系（改 vendor 立即生效）。
 *  目录先清空重建；个别文件链不上（被占用等）就退化成复制，保证内容一致。 */
function mirrorTree(from, to) {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const s = join(from, name);
    const d = join(to, name);
    if (statSync(s).isDirectory()) {
      mirrorTree(s, d);
      continue;
    }
    try {
      linkSync(s, d);
    } catch {
      cpSync(s, d);
    }
  }
}

if (!existsSync(srcRoot)) throw new Error('源码树不存在：' + srcRoot);
if (!existsSync(pkgRoot)) throw new Error('运行副本不存在：' + pkgRoot);

if (!process.argv.includes('--no-build')) {
  console.log('[sync-pet] 构建源码树（tsdown → lib，shared → shared-core，tsc → types）…');
  execSync('npm run build', { cwd: srcRoot, stdio: 'inherit' });
}

for (const part of PARTS) {
  const src = join(srcRoot, part);
  const dest = join(pkgRoot, part);
  if (!existsSync(src)) throw new Error('源不存在：' + src);
  if (!existsSync(dest)) throw new Error('目标不存在：' + dest);
  backupThenReplace(src, dest);
  console.log('[sync-pet] 已同步 ' + part);
}

if (existsSync(profileRoot)) {
  for (const part of PARTS) {
    mirrorTree(join(pkgRoot, part), join(profileRoot, part));
  }
  console.log('[sync-pet] 已重建硬链 → ' + profileRoot);
} else {
  console.log('[sync-pet] 跳过 node_modules 副本（不存在）：' + profileRoot);
}

console.log('[sync-pet] 完成。重启 studio 生效。');
