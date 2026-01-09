// TODO: Totally replace this with a proper implementation
// Sorry for people having to see this code

import { promises as fs } from "node:fs";
import path from "node:path";

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

function transformFigmaData(data) {
  const themes = {};

  data.forEach((collection) => {
    const collectionName = Object.keys(collection)[0];
    const collectionData = collection[collectionName];

    if (collectionData.modes) {
      themes[collectionName] = {};

      Object.keys(collectionData.modes).forEach((modeName) => {
        const modeData = collectionData.modes[modeName];
        const flattenedMode = {};

        for (const key in modeData) {
          if (Object.prototype.hasOwnProperty.call(modeData, key)) {
            const value = modeData[key];

            if (value && "$type" in value && "$value" in value) {
              const transformedType =
                value.$type === "float" ? "dimension" : value.$type;

              flattenedMode[key] = {
                ...value,
                $type: transformedType,
                $collectionName: collectionName,
              };
            }
          }
        }

        themes[collectionName][modeName] = flattenedMode;
      });
    }
  });

  return themes;
}

function transformTokenStudioData(data) {
  const flattenedOutput = {};

  function flatten(obj, prefix = []) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const newPrefix = [...prefix, key];

        // Skip metadata and themes
        if (key === "$metadata" || key === "$themes") {
          continue;
        }

        if (value && typeof value === "object" && !Array.isArray(value)) {
          if ("value" in value && "type" in value) {
            const tokenName = key;

            // Handle token references in the value
            let tokenValue = value.value;
            if (typeof tokenValue === "string" && tokenValue.includes("{")) {
              // Convert references like "{blue}" to just "{blue}" - no path needed anymore
              tokenValue = tokenValue.replace(/\{([^}]+)\}/g, (match, path) => {
                // If there's a path with dots, take the last part
                const parts = path.split(".");
                return `{${parts[parts.length - 1]}}`;
              });
            }

            flattenedOutput[tokenName] = {
              $value: tokenValue,
              $type: value.type,
            };
          } else {
            flatten(value, newPrefix);
          }
        }
      }
    }
  }

  flatten(data);
  return flattenedOutput;
}

async function processJSON(inputPath, outputPath, format) {
  const rawData = await fs.readFile(inputPath, "utf-8");
  const data = JSON.parse(rawData);

  const transformedData =
    format === "figma"
      ? transformFigmaData(data)
      : transformTokenStudioData(data);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(
    outputPath,
    JSON.stringify(transformedData, null, 2),
    "utf-8"
  );

  log(`Flattened ${format} JSON written to ${outputPath}`);
}

// Process both file types
const processFiles = async () => {
  try {
    const brand = getBrandName();
    
    if (!brand) {
      error("❌ Error: Brand name is required. Use --brand <brand-name>");
      process.exit(1);
    }
    
    const inputPath = path.join("brands", `${brand}-tokens.json`);
    const outputPath = "./output/tokens-flattened.json";
    
    // Check if file exists
    try {
      await fs.access(inputPath);
    } catch (err) {
      error(`❌ Error: Brand file not found: ${inputPath}`);
      process.exit(1);
    }
    
    await processJSON(
      inputPath,
      outputPath,
      "figma"
    );

    log(`✅ All files processed successfully for brand: ${brand}`);
  } catch (err) {
    error("❌ Error processing files:", err);
    process.exit(1);
  }
};

processFiles();
