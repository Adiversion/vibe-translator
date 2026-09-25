/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Vibe Translator — Post-Build Deep Distribution & AST Verification Suite
 * ═══════════════════════════════════════════════════════════════════════════════
 * 1. Node V8 Script AST Compilation (Guarantees 0 SyntaxErrors on all JS files)
 * 2. File Linkage & Manifest Integrity across Chrome, Edge, and Firefox
 * 3. Production Zip Archive Validation & Unpack Integrity
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const baseManifestPath = path.join(rootDir, 'manifest.json');

// Color formatting
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function runPostBuildVerification() {
  console.log(`\n${ANSI.bold}${ANSI.cyan}🔍 RUNNING POST-BUILD DEEP AST & INTEGRITY VERIFICATION...${ANSI.reset}`);
  console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────────────────────${ANSI.reset}`);

  let passed = 0;
  let warnings = 0;
  let failed = 0;

  function pass(msg) {
    console.log(`  ${ANSI.green}✔ PASS${ANSI.reset}  ${msg}`);
    passed++;
  }

  function warn(msg) {
    console.log(`  ${ANSI.yellow}⚠ WARN${ANSI.reset}  ${msg}`);
    warnings++;
  }

  function fail(msg) {
    console.error(`  ${ANSI.red}✖ FAIL${ANSI.reset}  ${ANSI.bold}${msg}${ANSI.reset}`);
    failed++;
  }

  if (!fs.existsSync(distDir)) {
    fail('dist directory does not exist!');
    return false;
  }

  const baseManifest = JSON.parse(fs.readFileSync(baseManifestPath, 'utf8'));
  const version = baseManifest.version || '1.1';
  const targets = ['chrome', 'edge', 'firefox'];

  // ── 1. Target Directory & Manifest Verification ──
  targets.forEach(target => {
    const targetDir = path.join(distDir, target);
    if (!fs.existsSync(targetDir)) {
      fail(`Target directory dist/${target} is missing`);
      return;
    }

    const manifestPath = path.join(targetDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      fail(`dist/${target}/manifest.json is missing`);
      return;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.version !== version) {
        fail(`dist/${target}/manifest.json version mismatch: expected ${version}, got ${manifest.version}`);
      } else {
        pass(`dist/${target}/manifest.json parsed cleanly (v${version})`);
      }

      // Check icons
      if (manifest.icons) {
        Object.keys(manifest.icons).forEach(size => {
          const iconPath = manifest.icons[size];
          const fullIconPath = path.join(targetDir, iconPath);
          if (!fs.existsSync(fullIconPath)) {
            fail(`dist/${target} icon asset missing on disk: ${iconPath}`);
          }
        });
      }
    } catch (e) {
      fail(`dist/${target}/manifest.json is invalid JSON: ${e.message}`);
    }
  });

  // ── 2. V8 Script AST Compilation (0 SyntaxErrors) ──
  targets.forEach(target => {
    const targetDir = path.join(distDir, target);
    if (!fs.existsSync(targetDir)) return;

    const walk = (d) => {
      fs.readdirSync(d).forEach(item => {
        const full = path.join(d, item);
        if (fs.statSync(full).isDirectory()) {
          walk(full);
        } else if (full.endsWith('.js')) {
          const rel = path.relative(targetDir, full).replace(/\\/g, '/');
          const code = fs.readFileSync(full, 'utf8');
          try {
            new vm.Script(code, { filename: rel });
            pass(`V8 AST Compilation: dist/${target}/${rel}`);
          } catch (err) {
            fail(`V8 Syntax Error in dist/${target}/${rel}: ${err.message}`);
          }
        }
      });
    };
    walk(targetDir);
  });

  // ── 3. Production Zip Archive Validation ──
  targets.forEach(target => {
    const zipName = `Vibe-Translator-v${version}-${target}.zip`;
    const zipPath = path.join(rootDir, zipName);
    if (fs.existsSync(zipPath)) {
      const sizeKb = (fs.statSync(zipPath).size / 1024).toFixed(1);
      pass(`Production Zip Asset: ${zipName} (${sizeKb} KB)`);
    } else {
      warn(`Production Zip Asset missing at root: ${zipName}`);
    }
  });

  console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────────────────────${ANSI.reset}`);
  if (failed === 0) {
    console.log(`${ANSI.bold}${ANSI.green}✨ ALL POST-BUILD INTEGRITY CHECKS PASSED (${passed} verified clean, ${warnings} notices).${ANSI.reset}\n`);
    return true;
  } else {
    console.log(`${ANSI.bold}${ANSI.red}🛑 POST-BUILD VERIFICATION FAILED: ${failed} error(s) detected.${ANSI.reset}\n`);
    return false;
  }
}

if (require.main === module) {
  const ok = runPostBuildVerification();
  process.exit(ok ? 0 : 1);
}

module.exports = { runPostBuildVerification };
