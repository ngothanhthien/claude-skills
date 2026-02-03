#!/usr/bin/env node

/**
 * Interactive CLI for installing external skills
 * Uses the 'prompts' library for beautiful interactive prompts
 * Flow: Groups (multiselect) -> Packages (multiselect) -> Install
 * Usage: node install.js
 */

import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, basename } from 'path';
import { createRequire } from 'module';
import { readlinkSync, existsSync, mkdirSync, readdirSync, readFileSync, lstatSync } from 'fs';

const require = createRequire(import.meta.url);
const prompts = require('prompts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes (moved before usage)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  red: '\x1b[31m'
};

function colorize(str, color) {
  return `${colors[color]}${str}${colors.reset}`;
}

// Load local registry from local.json
let locals = [];

try {
  function loadLocalRegistry(localName, scriptName, transformer = null) {
    const localPath = join(process.cwd(), localName);
    const scriptPath = join(__dirname, scriptName);

    let data = null;
    let source = null;

    // Try local first
    try {
      if (existsSync(localPath)) {
        data = JSON.parse(readFileSync(localPath, 'utf-8'));
        source = `local ${localName}`;
      }
    } catch (err) {
      // Ignore, try script directory
    }

    // Fallback to script directory
    if (!data) {
      try {
        data = JSON.parse(readFileSync(scriptPath, 'utf-8'));
        source = `central ${scriptName}`;
      } catch (err) {
        console.warn(`Warning: Could not load ${scriptName}:`, err.message);
      }
    }

    if (data && transformer) {
      return transformer(data);
    }
    return data;
  }

  // Load locals from local.json
  const localRegistry = loadLocalRegistry('local.json', 'local.json');
  if (localRegistry?.locals) {
    // Resolve absolute paths (paths are already absolute in local.json)
    locals = localRegistry.locals.map(local => ({
      ...local,
      path: local.path.startsWith('/') ? local.path : resolve(__dirname, local.path)
    }));
  }

  if (locals.length === 0) {
    console.warn('No locals found in local.json');
  }
} catch (err) {
  console.warn('Failed to load local registry:', err.message);
}

// Create symlink for local items
function createSymlink(sourcePath, targetPath, type, debug = false) {
  try {
    // Check if source and target are the same (already in place)
    const resolvedSource = resolve(sourcePath);
    const resolvedTarget = resolve(targetPath);
    if (resolvedSource === resolvedTarget) {
      if (debug) {
        console.log(colorize(`    [DEBUG] Source and target are the same: ${targetPath}`, 'dim'));
      }
      return { success: true, skipped: true };
    }

    // Check if target already exists
    if (existsSync(targetPath)) {
      // Check if it's already a symlink to the correct source
      try {
        const existingLink = readlinkSync(targetPath);
        const resolvedSource = resolve(sourcePath);
        const resolvedExisting = resolve(existingLink);

        if (resolvedExisting === resolvedSource) {
          if (debug) {
            console.log(colorize(`    [DEBUG] Symlink already exists: ${targetPath}`, 'dim'));
          }
          return { success: true, skipped: true };
        }
      } catch (err) {
        // Not a symlink or can't read, remove and recreate
        if (debug) {
          console.log(colorize(`    [DEBUG] Target exists but not correct symlink, removing: ${targetPath}`, 'yellow'));
        }
        spawnSync('rm', ['-rf', targetPath], { stdio: debug ? 'inherit' : 'pipe' });
      }
    }

    // Create parent directory if it doesn't exist
    const parentDir = dirname(targetPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Create the symlink
    // Use relative symlink for portability
    const relativeSource = relativePath(dirname(targetPath), sourcePath);
    const lnResult = spawnSync('ln', ['-s', relativeSource, targetPath], { stdio: debug ? 'inherit' : 'pipe' });

    // Check if ln command succeeded
    if (lnResult.status !== 0 || lnResult.error) {
      const stderr = lnResult.stderr ? lnResult.stderr.toString().trim() : '';
      const errorMsg = lnResult.error?.message || stderr || `ln failed with code ${lnResult.status}`;
      if (debug) {
        console.log(colorize(`    [DEBUG] Symlink creation failed: ${errorMsg}`, 'red'));
        console.log(colorize(`    [DEBUG] ln -s ${relativeSource} ${targetPath}`, 'dim'));
      }
      return { success: false, error: errorMsg };
    }

    if (debug) {
      console.log(colorize(`    [DEBUG] Created symlink: ${targetPath} -> ${relativeSource}`, 'dim'));
    }

    return { success: true, skipped: false };
  } catch (err) {
    if (debug) {
      console.log(colorize(`    [DEBUG] Symlink failed: ${err.message}`, 'red'));
    }
    return { success: false, error: err.message };
  }
}

// Calculate relative path between two absolute paths
function relativePath(from, to) {
  // Normalize paths first
  const normalizedFrom = from.replace(/\/+$/, '');
  const normalizedTo = to.replace(/\/+$/, '');

  // If paths are identical, use basename
  if (normalizedFrom === normalizedTo) {
    return basename(normalizedTo);
  }

  const fromParts = normalizedFrom.split('/').filter(p => p);
  const toParts = normalizedTo.split('/').filter(p => p);

  // Find common prefix
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  // Build relative path
  const upCount = fromParts.length - commonLength;
  const downParts = toParts.slice(commonLength);

  let relative = '';
  for (let i = 0; i < upCount; i++) {
    relative += '../';
  }
  relative += downParts.join('/');

  // Handle edge case where relative path would be empty or just '.'
  if (!relative || relative === '.') {
    return basename(normalizedTo);
  }

  return relative;
}

// Load skills registry from both external.json and mcp.json
// Checks current directory first, then falls back to script directory
let skills = [];

try {
  // Helper to load registry with fallback
  function loadRegistry(localName, scriptName, transformer = null) {
    // Try current directory first
    const localPath = join(process.cwd(), localName);
    const scriptPath = join(__dirname, scriptName);

    let data = null;
    let source = null;

    // Try local first
    try {
      if (existsSync(localPath)) {
        data = JSON.parse(readFileSync(localPath, 'utf-8'));
        source = `local ${localName}`;
      }
    } catch (err) {
      // Ignore, try script directory
    }

    // Fallback to script directory
    if (!data) {
      try {
        data = JSON.parse(readFileSync(scriptPath, 'utf-8'));
        source = `central ${scriptName}`;
      } catch (err) {
        console.warn(`Warning: Could not load ${scriptName}:`, err.message);
      }
    }

    if (data && transformer) {
      return transformer(data);
    }
    return data;
  }

  // Load from external.json (with local fallback)
  const externalRegistry = loadRegistry('external.json', 'external.json');
  if (externalRegistry?.skills) {
    skills.push(...externalRegistry.skills);
  }

  // Load from mcp.json and transform (with local fallback)
  const mcpRegistry = loadRegistry('mcp.json', 'mcp.json', (data) => {
    const mcpSkills = Object.entries(data.mcpServers || {}).map(([name, config]) => ({
      name,
      description: config.meta?.description || '',
      group: config.meta?.group || 'other',
      commands: {
        add: config.add
      },
      url: config.meta?.url,
      version: config.meta?.version
    }));
    return { ...data, mcpSkills };
  });
  if (mcpRegistry?.mcpSkills) {
    skills.push(...mcpRegistry.mcpSkills);
  }

  // Debug: Show registry sources
  const isDebug = process.argv.includes('--debug');
  if (isDebug) {
    const localExternal = join(process.cwd(), 'external.json');
    const localMcp = join(process.cwd(), 'mcp.json');
    console.log(colorize(`  [DEBUG] Local external.json exists: ${existsSync(localExternal)}`, 'yellow'));
    console.log(colorize(`  [DEBUG] Local mcp.json exists: ${existsSync(localMcp)}`, 'yellow'));
    console.log(colorize(`  [DEBUG] Total skills loaded: ${skills.length}`, 'yellow'));
    console.log();
  }

  if (skills.length === 0) {
    console.error('No skills found in external.json or mcp.json');
    process.exit(1);
  }
} catch (err) {
  console.error('Failed to load registries:', err.message);
  process.exit(1);
}

// Options for prompts with cancel handling
const promptOptions = {
  onCancel: () => {
    console.log('\n  Operation cancelled.\n');
    process.exit(0);
  }
};

function executeCommand(cmd, debug = false) {
  try {
    if (debug) {
      console.log(colorize(`    [DEBUG] cwd: ${process.cwd()}`, 'dim'));
      console.log(colorize(`    [DEBUG] cmd: ${cmd}`, 'dim'));
    }
    // Explicitly run commands in the current working directory (where user invoked the script)
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (err) {
    if (debug) {
      console.log(colorize(`    [DEBUG] failed: ${err.message}`, 'red'));
    }
    return false;
  }
}

// Get unique groups
function getGroups() {
  const groupSet = new Set();
  for (const skill of skills) {
    groupSet.add(skill.group || 'other');
  }
  return Array.from(groupSet).sort();
}

// Get skills by groups
function getSkillsByGroups(selectedGroups) {
  return skills.filter(skill =>
    selectedGroups.includes(skill.group || 'other')
  );
}

// Display header
function showHeader(title) {
  console.clear();
  console.log(colorize('╔════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize(`║     External Skills Installer${title ? ' - ' + title : ''}            ║`, 'cyan'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'cyan'));
  console.log();
}

// Step 1: Select groups
async function selectGroups() {
  const groups = getGroups();

  showHeader('Select Groups');

  const response = await prompts({
    type: 'multiselect',
    name: 'selectedGroups',
    message: 'Which groups would you like to install from?',
    choices: groups.map(g => ({ title: g, value: g })),
    hint: '- Space to select. Return to submit'
  }, promptOptions);

  if (!response.selectedGroups || response.selectedGroups.length === 0) {
    return null;
  }

  return response.selectedGroups;
}

// Step 2: Select packages
async function selectPackages(groups) {
  const filteredSkills = getSkillsByGroups(groups);

  if (filteredSkills.length === 0) {
    console.log(colorize('  No packages found in selected groups.', 'yellow'));
    return null;
  }

  showHeader('Select Packages');

  const response = await prompts({
    type: 'multiselect',
    name: 'selectedPackages',
    message: 'Which packages would you like to install?',
    choices: filteredSkills.map(skill => ({
      title: skill.name + (skill.version ? ` (${skill.version})` : ''),
      description: skill.description,
      value: skill.name
    })),
    hint: '- Space to select. Return to submit'
  }, promptOptions);

  if (!response.selectedPackages || response.selectedPackages.length === 0) {
    return null;
  }

  // Return full skill objects
  return filteredSkills.filter(s => response.selectedPackages.includes(s.name));
}

// Step 3: Confirm installation
async function confirmInstallation(skillsToInstall) {
  showHeader('Confirm Installation');

  console.log(colorize('  Packages to install:', 'bright'));
  console.log(colorize('  ─────────────────────', 'dim'));
  console.log();

  skillsToInstall.forEach((skill, index) => {
    const cmd = skill.commands.add;
    console.log(colorize(`  ${index + 1}. ${skill.name}`, 'cyan'));
    console.log(colorize(`     ${skill.description}`, 'dim'));
    console.log(colorize(`     Command: ${cmd}`, 'yellow'));
    console.log();
  });

  console.log(colorize('───────────────────────────────────────────────────────────', 'dim'));

  const response = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Install these packages?',
    initial: true
  }, promptOptions);

  return response.confirm;
}

// Step 4: Install packages
async function installPackages(skillsToInstall, debug = false) {
  console.log();
  console.log(colorize('  Installing packages...', 'bright'));
  console.log(colorize('  ═══════════════════════════════════════════════════════════', 'dim'));

  if (debug) {
    console.log(colorize(`  [DEBUG] Current working directory: ${process.cwd()}`, 'yellow'));
    console.log();
  }

  const results = {
    success: [],
    failed: []
  };

  for (const skill of skillsToInstall) {
    const currentIndex = results.success.length + results.failed.length + 1;
    console.log();
    console.log(colorize(`  [${currentIndex}/${skillsToInstall.length}] ${skill.name}`, 'bright'));

    // Install dependencies first
    if (skill.commands.dependencies?.requires) {
      console.log(colorize('    Installing dependencies...', 'yellow'));
      for (const cmd of skill.commands.dependencies.requires) {
        if (!executeCommand(cmd, debug)) {
          console.log(colorize('    ⚠ Dependency failed, continuing...', 'yellow'));
        }
      }
    }

    // Install skill
    if (executeCommand(skill.commands.add, debug)) {
      console.log(colorize(`    ✓ ${skill.name} installed!`, 'green'));
      results.success.push(skill);
    } else {
      console.log(colorize(`    ✗ ${skill.name} failed!`, 'red'));
      results.failed.push(skill);
    }
  }

  // Summary
  showHeader('Installation Summary');

  console.log();
  console.log(colorize('  Results:', 'bright'));
  console.log(colorize('  ────────', 'dim'));
  console.log();

  if (results.success.length > 0) {
    console.log(colorize(`  ✓ Installed: ${results.success.length}`, 'green'));
    results.success.forEach(s => console.log(colorize(`    - ${s.name}`, 'dim')));
  }

  if (results.failed.length > 0) {
    console.log();
    console.log(colorize(`  ✗ Failed: ${results.failed.length}`, 'red'));
    results.failed.forEach(s => console.log(colorize(`    - ${s.name}`, 'dim')));
  }

  console.log();

  return results;
}

// ==================== LOCAL INSTALLATION ====================

// Get unique local types
function getLocalTypes() {
  const typeSet = new Set();
  for (const local of locals) {
    typeSet.add(local.type || 'skill');
  }
  return Array.from(typeSet).sort();
}

// Get locals by types
function getLocalsByTypes(selectedTypes) {
  return locals.filter(local =>
    selectedTypes.includes(local.type || 'skill')
  );
}

// Select local types
async function selectLocalTypes() {
  const types = getLocalTypes();

  showHeader('Select Local Types');

  const response = await prompts({
    type: 'multiselect',
    name: 'selectedTypes',
    message: 'Which types would you like to install from?',
    choices: types.map(t => ({ title: t === 'agent' ? 'Agents (.claude/agents/ folder)' : 'Skills (.claude/skills/ folder)', value: t })),
    hint: '- Space to select. Return to submit'
  }, promptOptions);

  if (!response.selectedTypes || response.selectedTypes.length === 0) {
    return null;
  }

  return response.selectedTypes;
}

// Select local items
async function selectLocalItems(types) {
  const filteredLocals = getLocalsByTypes(types);

  if (filteredLocals.length === 0) {
    console.log(colorize('  No items found in selected types.', 'yellow'));
    await new Promise(resolve => setTimeout(resolve, 1500));
    return null;
  }

  showHeader('Select Local Items');

  const response = await prompts({
    type: 'multiselect',
    name: 'selectedItems',
    message: 'Which local items would you like to install?',
    choices: filteredLocals.map(local => ({
      title: `${local.name} (${local.type})`,
      description: `${local.description} - ${local.path}`,
      value: local.name
    })),
    hint: '- Space to select. Return to submit'
  }, promptOptions);

  if (!response.selectedItems) {
    return null;
  }

  if (response.selectedItems.length === 0) {
    console.log(colorize('  No items selected.', 'yellow'));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return null;
  }

  // Return full local objects
  return filteredLocals.filter(l => response.selectedItems.includes(l.name));
}

// Confirm local installation
async function confirmLocalInstallation(localsToInstall) {
  showHeader('Confirm Local Installation');

  console.log(colorize('  Items to link:', 'bright'));
  console.log(colorize('  ───────────────', 'dim'));
  console.log();

  localsToInstall.forEach((local, index) => {
    const targetFolder = local.type === 'agent' ? '.claude/agents/' : '.claude/skills/';
    console.log(colorize(`  ${index + 1}. ${local.name}`, 'cyan'));
    console.log(colorize(`     Type: ${local.type}`, 'dim'));
    console.log(colorize(`     Source: ${local.path}`, 'yellow'));
    console.log(colorize(`     Target: ${targetFolder}${local.name}${local.type === 'agent' ? '.md' : '/'}`, 'yellow'));
    console.log();
  });

  console.log(colorize('───────────────────────────────────────────────────────────', 'dim'));

  const response = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Create symlinks for these items?',
    initial: true
  }, promptOptions);

  return response.confirm;
}

// Install local items via symlinks
async function installLocalItems(localsToInstall, debug = false) {
  console.log();
  console.log(colorize('  Creating symlinks...', 'bright'));
  console.log(colorize('  ═══════════════════════════════════════════════════════════', 'dim'));

  // Use current working directory where user invoked the script
  const projectRoot = process.cwd();

  if (debug) {
    console.log(colorize(`  [DEBUG] Project root: ${projectRoot}`, 'yellow'));
    console.log(colorize(`  [DEBUG] Items to install: ${localsToInstall.length}`, 'yellow'));
    console.log();
  }

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  for (const local of localsToInstall) {
    const currentIndex = results.success.length + results.failed.length + results.skipped.length + 1;
    console.log();
    console.log(colorize(`  [${currentIndex}/${localsToInstall.length}] ${local.name}`, 'bright'));

    if (debug) {
      console.log(colorize(`    [DEBUG] Type: ${local.type}`, 'dim'));
      console.log(colorize(`    [DEBUG] Original path: ${local.path}`, 'dim'));
    }

    let sourcePath = local.path;
    let targetPath;

    if (local.type === 'agent') {
      // For agents, we need to find the .md file in the source folder
      // and symlink it to the agents/ folder
      if (!existsSync(sourcePath)) {
        console.log(colorize(`    ✗ Source path not found: ${sourcePath}`, 'red'));
        results.failed.push({ ...local, error: 'Source path not found' });
        continue;
      }

      // Check if source is a file (direct .md) or folder
      const stat = lstatSync(sourcePath);

      if (stat.isFile()) {
        // Direct .md file
        targetPath = join(projectRoot, '.claude', 'agents', basename(sourcePath));
      } else if (stat.isDirectory()) {
        // Folder - find SKILL.md or .md files inside
        const skillMd = join(sourcePath, 'SKILL.md');
        const nameMd = join(sourcePath, `${basename(sourcePath)}.md`);

        if (existsSync(skillMd)) {
          sourcePath = skillMd;
          targetPath = join(projectRoot, '.claude', 'agents', basename(skillMd));
        } else if (existsSync(nameMd)) {
          sourcePath = nameMd;
          targetPath = join(projectRoot, '.claude', 'agents', basename(nameMd));
        } else {
          // Find any .md file in the folder
          const files = readdirSync(sourcePath);
          const mdFile = files.find(f => f.endsWith('.md'));

          if (mdFile) {
            sourcePath = join(sourcePath, mdFile);
            targetPath = join(projectRoot, '.claude', 'agents', mdFile);
          } else {
            console.log(colorize(`    ✗ No .md file found in: ${local.path}`, 'red'));
            results.failed.push({ ...local, error: 'No .md file found' });
            continue;
          }
        }
      }
    } else {
      // For skills, symlink the entire folder to .claude/skills/
      targetPath = join(projectRoot, '.claude', 'skills', basename(local.path));

      if (!existsSync(sourcePath)) {
        console.log(colorize(`    ✗ Source path not found: ${sourcePath}`, 'red'));
        results.failed.push({ ...local, error: 'Source path not found' });
        continue;
      }
    }

    // Create symlink
    if (debug) {
      console.log(colorize(`    [DEBUG] Source: ${sourcePath}`, 'dim'));
      console.log(colorize(`    [DEBUG] Target: ${targetPath}`, 'dim'));
    }
    const result = createSymlink(sourcePath, targetPath, local.type, debug);

    if (result.success) {
      if (result.skipped) {
        console.log(colorize(`    ⊙ ${local.name} already linked`, 'yellow'));
        results.skipped.push(local);
      } else {
        console.log(colorize(`    ✓ ${local.name} linked!`, 'green'));
        results.success.push(local);
      }
    } else {
      console.log(colorize(`    ✗ ${local.name} failed: ${result.error}`, 'red'));
      results.failed.push({ ...local, error: result.error });
    }
  }

  // Summary
  showHeader('Local Installation Summary');

  console.log();
  console.log(colorize('  Results:', 'bright'));
  console.log(colorize('  ────────', 'dim'));
  console.log();

  if (results.success.length > 0) {
    console.log(colorize(`  ✓ Linked: ${results.success.length}`, 'green'));
    results.success.forEach(l => console.log(colorize(`    - ${l.name}`, 'dim')));
  }

  if (results.skipped.length > 0) {
    console.log();
    console.log(colorize(`  ⊙ Already linked: ${results.skipped.length}`, 'yellow'));
    results.skipped.forEach(l => console.log(colorize(`    - ${l.name}`, 'dim')));
  }

  if (results.failed.length > 0) {
    console.log();
    console.log(colorize(`  ✗ Failed: ${results.failed.length}`, 'red'));
    results.failed.forEach(l => console.log(colorize(`    - ${l.name}: ${l.error}`, 'dim')));
  }

  console.log();

  return results;
}

// Main flow
async function main() {
  // Check for --debug flag
  const debugMode = process.argv.includes('--debug');

  if (debugMode) {
    console.log(colorize(`  [DEBUG] Script directory: ${__dirname}`, 'yellow'));
    console.log(colorize(`  [DEBUG] Current directory: ${process.cwd()}`, 'yellow'));
    console.log(colorize(`  [DEBUG] Locals loaded: ${locals.length}`, 'yellow'));
    console.log();
  }

  showHeader();

  // Build menu choices
  const menuChoices = [
    { title: 'Install skills', value: 'install' }
  ];

  // Add local installation option if locals are available
  if (locals.length > 0) {
    menuChoices.push({ title: `Install local (${locals.length} items)`, value: 'local' });
  }

  menuChoices.push(
    { title: 'Exit', value: 'exit' }
  );

  const introResponse = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: menuChoices,
    initial: 0
  }, promptOptions);

  if (introResponse.action === 'exit') {
    console.log(colorize('\n  Goodbye!\n', 'green'));
    process.exit(0);
  }

  if (introResponse.action === 'local') {
    // Local installation flow
    while (true) {
      // Step 1: Select types
      const selectedTypes = await selectLocalTypes();
      if (!selectedTypes) {
        break;
      }

      // Step 2: Select items
      const selectedItems = await selectLocalItems(selectedTypes);
      if (!selectedItems) {
        continue;
      }

      // Step 3: Confirm installation
      const confirmed = await confirmLocalInstallation(selectedItems);
      if (!confirmed) {
        continue;
      }

      // Step 4: Install
      await installLocalItems(selectedItems, debugMode);

      // Ask if user wants to install more
      const againResponse = await prompts({
        type: 'confirm',
        name: 'again',
        message: 'Install more local items?',
        initial: false
      }, promptOptions);

      if (!againResponse.again) {
        break;
      }
    }

    console.log(colorize('\n  Goodbye!\n', 'green'));
    process.exit(0);
  }

  // Remote installation flow (original)
  while (true) {
    // Step 1: Select groups
    const selectedGroups = await selectGroups();
    if (!selectedGroups) {
      break;
    }

    // Step 2: Select packages
    const selectedPackages = await selectPackages(selectedGroups);
    if (!selectedPackages) {
      continue;
    }

    // Step 3: Confirm installation
    const confirmed = await confirmInstallation(selectedPackages);
    if (!confirmed) {
      continue;
    }

    // Step 4: Install
    await installPackages(selectedPackages, debugMode);

    // Ask if user wants to install more
    const againResponse = await prompts({
      type: 'confirm',
      name: 'again',
      message: 'Install more packages?',
      initial: false
    }, promptOptions);

    if (!againResponse.again) {
      break;
    }
  }

  console.log(colorize('\n  Goodbye!\n', 'green'));
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
