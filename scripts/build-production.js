const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const baseManifestPath = path.join(rootDir, 'manifest.json');
const baseManifest = JSON.parse(fs.readFileSync(baseManifestPath, 'utf8'));

const { runComplianceChecks } = require('./verify-webstore-compliance.js');
const { runPostBuildVerification } = require('./verify-dist.js');

// ── STEP 0: Pre-Build Chrome Web Store Compliance & Quality Gate ──
const isCompliant = runComplianceChecks();
if (!isCompliant) {
  console.error('\n❌ Build aborted: Chrome Web Store compliance checks failed!\n');
  process.exit(1);
}

const version = baseManifest.version || '1.1';
console.log(`🚀 Starting Clean Vibe Translator Production Build (v${version})...\n`);

// Helpers for cross-node compatibility
function rmDirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    const entries = fs.readdirSync(dirPath);
    for (let i = 0; i < entries.length; i++) {
      const curPath = path.join(dirPath, entries[i]);
      if (fs.statSync(curPath).isDirectory()) {
        rmDirRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    }
    fs.rmdirSync(dirPath);
  }
}

function mkdirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    mkdirRecursive(path.dirname(dirPath));
    try {
      fs.mkdirSync(dirPath);
    } catch (_) {}
  }
}

// Resolve Terser from local or ReturnPilot node_modules
let terser = null;
try {
  terser = require('terser');
} catch (_) {
  try {
    terser = require('D:/ReturnPilot V4.0 mv3 safe/ReturnPilot-GST-Assistant/node_modules/terser');
  } catch (e) {
    console.warn('  ⚠️ Terser not found, falling back to regex stripper');
  }
}

function stripCommentsAndWhitespace(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\bdebugger\s*;?/g, '')
    .split('\n')
    .map(l => l.trimEnd())
    .filter(l => l.trim().length > 0)
    .join('\n');
}

async function minifyJavaScript(code, src) {
  if (terser) {
    try {
      const res = await terser.minify(code, {
        ecma: 2020,
        compress: {
          drop_console: true,
          drop_debugger: true,
          dead_code: true,
          unused: true,
          passes: 2
        },
        mangle: {
          toplevel: false,
          keep_fnames: true,
          keep_classnames: true
        },
        format: {
          comments: false
        }
      });

      if (res && res.code) {
        return res.code;
      }
    } catch (err) {
      console.warn(`  ⚠️ Terser error on ${path.basename(src)}:`, err.message);
    }
  }

  return stripCommentsAndWhitespace(code);
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
    .replace(/\;}/g, '}')
    .trim();
}

function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s+/gm, '')
    .trim();
}

async function processFile(src, dest) {
  mkdirRecursive(path.dirname(dest));
  if (src.endsWith('.css')) {
    const css = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, minifyCss(css), 'utf8');
  } else if (src.endsWith('.html')) {
    const html = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, minifyHtml(html), 'utf8');
  } else if (src.endsWith('.js')) {
    const js = fs.readFileSync(src, 'utf8');
    const minJs = await minifyJavaScript(js, src);
    fs.writeFileSync(dest, minJs, 'utf8');
  } else {
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
}

const FILES_TO_PACKAGE = [
  'popup.html',
  'popup.js',
  'styles.css',
  'vibe-bridge.js',
  'vibe-inject.js',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

const TARGETS = {
  chrome: {
    name: 'Google Chrome',
    manifestGenerator: (base) => {
      const m = JSON.parse(JSON.stringify(base));
      delete m.browser_specific_settings;
      return m;
    }
  },
  edge: {
    name: 'Microsoft Edge',
    manifestGenerator: (base) => {
      const m = JSON.parse(JSON.stringify(base));
      delete m.browser_specific_settings;
      return m;
    }
  },
  firefox: {
    name: 'Mozilla Firefox',
    manifestGenerator: (base) => {
      const m = JSON.parse(JSON.stringify(base));
      m.background = {
        scripts: ['vibe-bridge.js']
      };
      m.browser_specific_settings = {
        gecko: {
          id: 'vibe-translator@adiversion.com',
          strict_min_version: '115.0'
        }
      };
      return m;
    }
  }
};

async function build() {
  // Step 1: Clean dist
  console.log('  🧹 Cleaning dist/ directory...');
  rmDirRecursive(distDir);
  mkdirRecursive(distDir);

  // Step 2: Build each target
  for (const [targetKey, targetConfig] of Object.entries(TARGETS)) {
    console.log(`  🔨 Building target: ${targetConfig.name} (dist/${targetKey})...`);
    const targetDir = path.join(distDir, targetKey);
    mkdirRecursive(targetDir);

    // Process files
    for (const file of FILES_TO_PACKAGE) {
      const srcPath = path.join(rootDir, file);
      const destPath = path.join(targetDir, file);
      if (fs.existsSync(srcPath)) {
        await processFile(srcPath, destPath);
      } else {
        console.warn(`    ⚠️ File missing: ${file}`);
      }
    }

    // Write tailored manifest.json
    const targetManifest = targetConfig.manifestGenerator(baseManifest);
    fs.writeFileSync(
      path.join(targetDir, 'manifest.json'),
      JSON.stringify(targetManifest, null, 2),
      'utf8'
    );
  }

  // Step 3: Package ZIPs
  console.log('\n  📦 Packaging production zip archives...');
  try {
    child_process.execSync(`python "${path.join(__dirname, 'make-zip.py')}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('  ✖ Error packaging zip:', err.message);
  }

  // Step 4: Run post-build verification
  const isDistValid = runPostBuildVerification();
  if (!isDistValid) {
    console.error('\n❌ Post-build verification failed!\n');
    process.exit(1);
  }

  console.log(`\n🎉 Production Build Complete! Files ready in dist/ and root zip archives.\n`);
}

build().catch(err => {
  console.error('\n❌ Fatal build error:', err);
  process.exit(1);
});
