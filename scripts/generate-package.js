import { promises as fs } from "node:fs";

const { error, log } = console;

/**
 * Get brand name from command line arguments or environment
 */
function getBrandName() {
  const args = process.argv.slice(2);
  const brandIndex = args.indexOf("--brand");

  if (brandIndex !== -1 && args[brandIndex + 1]) {
    return args[brandIndex + 1];
  }

  // Fallback to environment variable or default
  return process.env.BRAND || null;
}

/**
 * Extract theme name from flattened theme key (e.g., "theme-amsterdam" -> "amsterdam")
 */
function extractThemeName(themeKey) {
  return themeKey.replace(/^theme-/, "");
}

/**
 * Generate package.json with brand-specific exports
 */
const generatePackage = async () => {
  try {
    const brand = getBrandName();

    if (!brand) {
      error("❌ Error: Brand name is required. Use --brand <brand-name>");
      process.exit(1);
    }

    const flattenedTokensPath = "./output/tokens-flattened.json";

    // Check if flattened tokens exist
    try {
      await fs.access(flattenedTokensPath);
    } catch (err) {
      error(`❌ Error: Flattened tokens not found: ${flattenedTokensPath}`);
      error("Please run 'npm run flatten:tokens' first");
      process.exit(1);
    }

    // Read flattened tokens to get all themes
    const rawData = await fs.readFile(flattenedTokensPath, "utf-8");
    const themes = JSON.parse(rawData);

    const themeNames = Object.keys(themes);

    if (themeNames.length === 0) {
      error("❌ Error: No themes found in flattened tokens");
      process.exit(1);
    }

    log(`📦 Generating package.json for brand: ${brand}`);
    log(`📋 Found ${themeNames.length} theme(s): ${themeNames.join(", ")}`);

    // Read existing package.json
    const packageJsonPath = "./package.json";
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);

    // Update package name
    packageJson.name = `@jens_erven/design-tokens-${brand}`;

    // Generate exports object
    const exports = {};

    // Generate token exports (TypeScript)
    for (const themeKey of themeNames) {
      const themeName = extractThemeName(themeKey);
      exports[`./tokens/${themeName}/light`] =
        `./output/${themeKey}/light/ts/tokens.ts`;
      exports[`./tokens/${themeName}/dark`] =
        `./output/${themeKey}/dark/ts/tokens.ts`;
    }

    // Generate CSS exports
    for (const themeKey of themeNames) {
      const themeName = extractThemeName(themeKey);
      exports[`./css/${themeName}/light`] =
        `./output/${themeKey}/light/css/tokens.css`;
      exports[`./css/${themeName}/dark`] =
        `./output/${themeKey}/dark/css/tokens.css`;
    }

    // Add Tailwind CSS export
    exports[`./css/tailwind`] = `./output/tailwind/app.css`;

    packageJson.exports = exports;

    // Write updated package.json
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
      "utf-8"
    );

    log(`✅ Package.json generated successfully`);
    log(`   Package name: ${packageJson.name}`);
    log(`   Exports: ${Object.keys(exports).length} entries`);
  } catch (err) {
    error("❌ Error generating package.json:", err);
    process.exit(1);
  }
};

generatePackage();
