import { promises as fs } from "node:fs";
import path from "node:path";

const { log, error } = console;

/**
 * Generate Tailwind CSS v4 theme files from design tokens
 */
const generateTailwindThemes = async () => {
  try {
    log("🎨 Generating Tailwind CSS v4 theme files...\n");

    const inputPath = "./output/tokens-flattened.json";
    const outputDir = "./output/tailwind";

    // Read the flattened themes file
    const rawData = await fs.readFile(inputPath, "utf-8");
    const themes = JSON.parse(rawData);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate individual theme files (one file per theme with both light and dark)
    const themeFiles = [];

    for (const [themeName, modes] of Object.entries(themes)) {
      log(`📦 Processing theme: ${themeName}`);

      const cssContent = generateTailwindThemeCSS(themeName, modes);
      const fileName = `${themeName}.css`;
      const filePath = path.join(outputDir, fileName);

      await fs.writeFile(filePath, cssContent, "utf-8");
      themeFiles.push({ themeName, fileName });

      log(`  ✅ ${fileName} created (light + dark modes)`);
    }

    // Generate the main app.css file that imports all themes
    log("\n📝 Generating app.css with all theme imports...");
    const appCssContent = generateAppCSS(themeFiles, themes);
    await fs.writeFile(path.join(outputDir, "app.css"), appCssContent, "utf-8");

    log("✅ app.css created");
    log("\n✨ Tailwind theme files generated successfully!");
    log(`📁 Output directory: ${outputDir}\n`);

    // Log usage instructions
    logUsageInstructions();
  } catch (err) {
    error("❌ An error occurred while generating Tailwind themes:");
    error(err);
    process.exit(1);
  }
};

/**
 * Generate Tailwind CSS v4 theme file content with both light and dark modes
 */
function generateTailwindThemeCSS(themeName, modes) {
  // Remove 'theme-' prefix if present to avoid duplication (e.g., theme-amsterdam -> amsterdam)
  const cleanThemeName = themeName.replace(/^theme-/, "");

  // Generate light mode variables
  const lightVars = Object.entries(modes.light)
    .map(([key, token]) => {
      const cssVarName = `--${kebabCase(key)}`;
      const value = token.$value;

      // Convert dimension values to appropriate units
      let cssValue = value;
      if (token.$type === "dimension" && typeof value === "number") {
        cssValue = `${value}px`;
      }

      return `   ${cssVarName}: ${cssValue};`;
    })
    .join("\n");

  // Generate dark mode variables
  const darkVars = Object.entries(modes.dark)
    .map(([key, token]) => {
      const cssVarName = `--${kebabCase(key)}`;
      const value = token.$value;

      // Convert dimension values to appropriate units
      let cssValue = value;
      if (token.$type === "dimension" && typeof value === "number") {
        cssValue = `${value}px`;
      }

      return `   ${cssVarName}: ${cssValue};`;
    })
    .join("\n");

  return `/**
 * Tailwind CSS v4 Theme: ${cleanThemeName}
 * Auto-generated from design tokens
 */

.theme-${cleanThemeName} {
${lightVars}
}

.theme-${cleanThemeName}.dark {
${darkVars}
}
`;
}

/**
 * Generate the main app.css file that imports tailwind and all themes
 */
function generateAppCSS(themeFiles, themes) {
  const themeNames = Object.keys(themes);

  // Generate imports for all theme files
  const themeImports = themeFiles
    .map(({ fileName }) => `@import "./${fileName}";`)
    .join("\n");

  // Generate default theme tokens
  const defaultTheme = themeNames[0];
  const defaultTokens = themes[defaultTheme].light;

  // Generate Tailwind-prefixed color utilities from theme tokens
  const colorUtilities = generateColorUtilities(defaultTokens);

  // Generate Tailwind-prefixed spacing utilities from theme tokens
  const spacingUtilities = generateSpacingUtilities(defaultTokens);

  return `@import "tailwindcss";

/* Import all theme definitions */
${themeImports}

@custom-variant dark (&:is(.dark *));

/* Disable all default Tailwind utilities */
@theme {
  --color-*: initial;
}

/* Map theme tokens to Tailwind-prefixed CSS variables for custom utilities */
@theme inline {${colorUtilities}${spacingUtilities}
}
`;
}

/**
 * Generate color utilities from theme tokens
 */
function generateColorUtilities(tokens) {
  const colorMappings = [];

  for (const [key, token] of Object.entries(tokens)) {
    if (token.$type === "color") {
      const tokenName = kebabCase(key);

      // Map colors to Tailwind's color system
      // e.g., --primary -> --color-primary
      if (
        key.includes("primary") ||
        key.includes("secondary") ||
        key.includes("error") ||
        key.includes("warning") ||
        key.includes("info") ||
        key.includes("success")
      ) {
        colorMappings.push(`    --color-${tokenName}: var(--${tokenName});`);
      }

      // Background colors
      if (key.includes("background")) {
        const bgName = tokenName.replace("background-", "");
        colorMappings.push(`    --color-bg-${bgName}: var(--${tokenName});`);
      }

      // Text colors
      if (key.includes("text")) {
        const textName = tokenName.replace("text-", "");
        colorMappings.push(
          `    --color-text-${textName}: var(--${tokenName});`
        );
      }
    }
  }

  return colorMappings.length > 0 ? "\n" + colorMappings.join("\n") : "";
}

/**
 * Generate spacing utilities from theme tokens
 */
function generateSpacingUtilities(tokens) {
  const spacingMappings = [];

  for (const [key, token] of Object.entries(tokens)) {
    if (token.$type === "dimension" || key.includes("spacing")) {
      const tokenName = kebabCase(key);

      // Map spacing to Tailwind's spacing system
      if (key.includes("spacing")) {
        const spacingName = tokenName.replace("spacing-", "");
        spacingMappings.push(
          `    --spacing-${spacingName}: var(--${tokenName});`
        );
      }

      // Border radius
      if (key.includes("radius") || key.includes("border-radius")) {
        spacingMappings.push(`    --radius-default: var(--${tokenName});`);
      }
    }
  }

  return spacingMappings.length > 0 ? "\n" + spacingMappings.join("\n") : "";
}

/**
 * Convert camelCase or snake_case to kebab-case
 */
function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Log usage instructions
 */
function logUsageInstructions() {
  log("📚 Usage Instructions:\n");
  log("1. Import the generated app.css in your main entry point:");
  log('   import "@portima/design-tokens/css/tailwind"\n');
  log("2. Apply theme classes to your root or any element:");
  log('   <html class="theme-amsterdam">\n');
  log('3. Toggle dark mode by adding the "dark" class:');
  log('   <html class="theme-amsterdam dark">\n');
  log("4. JavaScript theme switching:");
  log('   document.documentElement.className = "theme-barcelona"');
  log('   document.documentElement.classList.toggle("dark")\n');
}

generateTailwindThemes();

