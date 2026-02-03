# External Skills Installer

Interactive CLI for browsing and installing external Claude skills from `external.json`.

Built with the [prompts](https://github.com/terkelg/prompts) library for beautiful, user-friendly prompts.

## Flow

1. **Select Groups** - Choose which groups to browse (multiselect with space)
2. **Select Packages** - Choose packages within selected groups (multiselect with space)
3. **Confirm** - Review and confirm installation
4. **Install** - All selected packages are installed

## Usage

### Option 1: Node.js Version (Recommended - Beautiful UI)
```bash
node install.js
```

### Option 2: Bash Version (No Dependencies)
```bash
./install.sh
```

### Option 3: Via npm (if linked globally)
```bash
npm install
skills-install
```

## Controls

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move up/down |
| Space | Toggle checkbox |
| Enter | Confirm selection |
| Esc | Cancel/Exit |

## Example

```
╔════════════════════════════════════════════════════════════╗
║     External Skills Installer - Select Groups            ║
╚════════════════════════════════════════════════════════════╝

? Which groups would you like to install from? - Space to select. Return to submit.
❯ ○ frontend-design
  ○ tools
  ○ typescript
  ✓ vite
  ○ vue
  ○ workflow
```

After selecting groups with Space and pressing Enter:

```
╔════════════════════════════════════════════════════════════╗
║     External Skills Installer - Select Packages          ║
╚════════════════════════════════════════════════════════════╝

? Which packages would you like to install? - Space to select. Return to submit.
❯ ○ tsdown - TypeScript bundler skill
  ○ vite (v5.0.0) - Vite build tool skill
  ✓ nuxt-vue - Nuxt Vue framework skill
```

## Features

- **Beautiful UI**: Professional prompts library like `bun create nuxt@latest`
- **Multiselect**: Choose multiple groups/packages with Space
- **Descriptions**: See package descriptions inline
- **Dependencies**: Automatically installs package dependencies
- **Summary**: View installation results with success/failure counts

## Adding New Skills

Edit `external.json` and add new skill entries following the schema:

```json
{
  "name": "skill-name",
  "author": "Author Name",
  "description": "Brief description",
  "version": "v1.0.0",
  "date": "Jan 1, 2026",
  "repo": "https://github.com/user/repo",
  "commands": {
    "add": "npx skills add user/repo --skill skill-name",
    "dependencies": {
      "check": "skill --version",
      "requires": ["npm install -g skill"],
      "update": "npm update -g skill"
    }
  },
  "group": "category"
}
```

## Schema Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique skill identifier |
| `author` | string | ✅ | Author/organization name |
| `description` | string | ✅ | Skill purpose summary |
| `repo` | string | ✅ | GitHub repository URL |
| `commands.add` | string | ✅ | Installation command |
| `group` | string | ✅ | Category/organizational tag |
| `version` | string | ❌ | Version string |
| `date` | string | ❌ | Release date |
| `commands.dependencies` | object | ❌ | Dependency info |
| `commands.dependencies.check` | string | ❌ | Verify installation |
| `commands.dependencies.requires` | array | ❌ | Setup commands |
| `commands.dependencies.update` | string | ❌ | Update command |
