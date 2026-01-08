import { promises as fs } from "node:fs";
import path from "node:path";
import StyleDictionary from "style-dictionary";

const { log, error } = console;

/**
 * Create Style Dictionary configuration for a specific theme and mode
 */
const createConfig = (themeName, mode, tokens, outputDir) => ({
  tokens,
  platforms: {
    css: {
      transformGroup: "css",
      transforms: ["size/pxToRem"],
      basePxFontSize: 16,
      buildPath: `${outputDir}/${themeName}/${mode}/css/`,
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            showFileHeader: false,
          },
        },
      ],
    },
    js: {
      transformGroup: "js",
      transforms: ["name/camel", "size/px"],
      buildPath: `${outputDir}/${themeName}/${mode}/ts/`,
      files: [
        {
          destination: "tokens.ts",
          format: "javascript/es6",
        },
      ],
    },
    ts: {
      transformGroup: "js",
      transforms: ["name/camel", "size/px"],
      buildPath: `${outputDir}/${themeName}/${mode}/ts/`,
      files: [
        {
          format: "typescript/es6-declarations",
          destination: "tokens.d.ts",
          options: {
            outputStringLiterals: false,
          },
        },
      ],
    },
  },
});

/**
 * Build all themes and modes from flattened JSON
 */
const buildMultiThemes = async () => {
  try {
    log("🎨 Building multi-theme design tokens...\n");

    const inputPath = "./output/tokens-flattened.json";
    const outputDir = "./output";

    // Read the flattened themes file
    const rawData = await fs.readFile(inputPath, "utf-8");
    const themes = JSON.parse(rawData);

    // Process each theme
    for (const [themeName, modes] of Object.entries(themes)) {
      log(`\n📦 Processing theme: ${themeName}`);

      // Process each mode (light/dark)
      for (const [modeName, tokens] of Object.entries(modes)) {
        log(`  ⚡ Building mode: ${modeName}`);

        const config = createConfig(themeName, modeName, tokens, outputDir);
        const sd = new StyleDictionary(config);

        await sd.hasInitialized;
        await sd.cleanAllPlatforms();
        await sd.buildAllPlatforms();

        log(`  ✅ ${themeName}/${modeName} built successfully`);
      }
    }

    // Create index file that exports all themes
    const indexContent = generateIndexFile(themes);
    await fs.writeFile(path.join(outputDir, "index.js"), indexContent, "utf-8");

    log("\n✨ All themes built successfully!");
    log(`📁 Output directory: ${outputDir}`);
  } catch (err) {
    error("❌ An error occurred while building themes:");
    error(err);
    process.exit(1);
  }
};

/**
 * Generate an index file that exports all theme configurations
 */
function generateIndexFile(themes) {
  const themeNames = Object.keys(themes);

  const imports = themeNames
    .flatMap((themeName) => [
      `import * as ${camelize(
        themeName
      )}Light from './${themeName}/light/ts/tokens.js';`,
      `import * as ${camelize(
        themeName
      )}Dark from './${themeName}/dark/ts/tokens.js';`,
    ])
    .join("\n");

  const exports = `
export const themes = {
${themeNames
  .map(
    (themeName) => `  '${themeName}': {
    light: ${camelize(themeName)}Light,
    dark: ${camelize(themeName)}Dark,
  }`
  )
  .join(",\n")}
};

export default themes;
`;

  return `/**
 * Auto-generated theme exports
 * This file provides easy access to all theme tokens
 */

${imports}
${exports}
`;
}

/**
 * Convert theme name to camelCase for variable names
 */
function camelize(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

buildMultiThemes();
