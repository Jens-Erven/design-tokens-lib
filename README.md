# Design Token Library

This repository builds and publishes design tokens as an npm package. It transforms Figma token exports into TypeScript, CSS variables, and Tailwind CSS v4 themes.

## Purpose

This library:
- Fetches design tokens from `design-token-repo`
- Validates token structure
- Transforms tokens into multiple formats (TypeScript, CSS, Tailwind CSS v4)
- Publishes to npm as `@portima/design-tokens`

## Installation

```bash
npm install @portima/design-tokens
```

## Usage

### TypeScript Tokens

```typescript
import * as amsterdamLight from '@portima/design-tokens/tokens/amsterdam/light';
import * as amsterdamDark from '@portima/design-tokens/tokens/amsterdam/dark';

console.log(amsterdamLight.primary); // "#009996"
```

### CSS Variables

```typescript
// Import CSS variables
import '@portima/design-tokens/css/amsterdam/light';
```

Then use in your CSS:
```css
.my-component {
  color: var(--primary);
  background: var(--background-default);
}
```

### Tailwind CSS v4

```typescript
// Import Tailwind CSS v4 theme
import '@portima/design-tokens/css/tailwind';
```

Then apply theme classes:
```html
<html class="theme-amsterdam">
  <!-- Light mode -->
</html>

<html class="theme-amsterdam dark">
  <!-- Dark mode -->
</html>
```

JavaScript theme switching:
```javascript
// Switch theme
document.documentElement.className = 'theme-barcelona';

// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

## Available Themes

- `amsterdam` (light/dark)
- `barcelona` (light/dark)
- `berlin` (light/dark)
- `lisbon` (light/dark)
- `london` (light/dark)

## Build Process

1. **Validate**: Validates token structure
2. **Flatten**: Transforms Figma format to flattened structure
3. **Build Variables**: Generates TypeScript and CSS via Style Dictionary
4. **Build Tailwind**: Generates Tailwind CSS v4 theme files

## Development

```bash
# Install dependencies
npm install

# Validate tokens (requires tokens-export.json)
npm run validate

# Flatten tokens
npm run flatten:tokens

# Build TypeScript and CSS
npm run build:variables

# Build Tailwind CSS v4
npm run build:tailwind

# Run full build
npm run build
```

## Tailwind CSS v4 Features

This package uses Tailwind CSS v4 syntax:

- `@import "tailwindcss"` - Imports Tailwind
- `@theme` - Theme configuration
- `@custom-variant dark` - Dark mode variant
- Class-based theme switching (`.theme-{name}`)
- CSS variable mapping to Tailwind utilities

## Package Exports

The package exports:

- **TypeScript tokens**: `@portima/design-tokens/tokens/{theme}/{mode}`
- **CSS variables**: `@portima/design-tokens/css/{theme}/{mode}`
- **Tailwind CSS v4**: `@portima/design-tokens/css/tailwind`

## CI/CD

This repository automatically:
- Listens for `repository_dispatch` events from `design-token-repo`
- Fetches latest tokens
- Validates and builds
- Publishes to npm
- Creates git tags

## Related Repositories

- **design-token-repo**: Source of truth for Figma token exports
- **component-lib**: Consumes this package and generates MUI themes

