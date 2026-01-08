import { promises as fs } from "node:fs";

const { error, log } = console;

/**
 * Validate design token structure
 */
const validateTokens = async () => {
  try {
    const inputPath = "./tokens-export.json";

    // Read and parse JSON
    let data;
    try {
      const rawData = await fs.readFile(inputPath, "utf-8");
      data = JSON.parse(rawData);
    } catch (err) {
      error("❌ Invalid JSON syntax:");
      error(err.message);
      process.exit(1);
    }

    // Check if it's an array
    if (!Array.isArray(data)) {
      error("❌ Error: tokens-export.json must be an array");
      process.exit(1);
    }

    // Check if at least one theme exists
    if (data.length === 0) {
      error("❌ Error: At least one theme must exist");
      process.exit(1);
    }

    // Validate each theme
    for (const themeObj of data) {
      const themeName = Object.keys(themeObj)[0];
      const theme = themeObj[themeName];

      // Check if theme has modes
      if (!theme.modes || typeof theme.modes !== "object") {
        error(`❌ Error: Theme ${themeName} must have a 'modes' object`);
        process.exit(1);
      }

      // Check if light and dark modes exist
      if (!theme.modes.light || !theme.modes.dark) {
        error(
          `❌ Error: Theme ${themeName} must have both 'light' and 'dark' modes`
        );
        process.exit(1);
      }

      // Validate tokens in each mode
      for (const [modeName, tokens] of Object.entries(theme.modes)) {
        if (typeof tokens !== "object") {
          error(
            `❌ Error: Theme ${themeName}, mode ${modeName} must be an object`
          );
          process.exit(1);
        }

        // Check if tokens have required properties
        for (const [tokenName, token] of Object.entries(tokens)) {
          if (!token.$type || !token.hasOwnProperty("$value")) {
            error(
              `❌ Error: Token ${tokenName} in ${themeName}/${modeName} must have $type and $value properties`
            );
            process.exit(1);
          }

          // Validate token types
          const validTypes = [
            "color",
            "dimension",
            "float",
            "string",
            "fontFamily",
            "fontWeight",
          ];
          if (!validTypes.includes(token.$type)) {
            error(
              `⚠️  Warning: Token ${tokenName} in ${themeName}/${modeName} has unknown type: ${token.$type}`
            );
          }
        }
      }
    }

    log("✅ Token structure is valid");
    log(`✅ Found ${data.length} theme(s)`);
    log("✅ All themes have light and dark modes");
    log("✅ All tokens have required properties");
  } catch (err) {
    error("❌ Error validating tokens:", err);
    process.exit(1);
  }
};

validateTokens();

