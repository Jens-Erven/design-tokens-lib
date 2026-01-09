import { execSync } from "child_process";

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

  return process.env.BRAND || null;
}

/**
 * Get the current published version of a brand package from npm
 */
function getPublishedVersion(brand) {
  const packageName = `@jens_erven/design-tokens-${brand}`;

  try {
    const result = execSync(`npm view ${packageName} version`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim();
  } catch (err) {
    // Package doesn't exist yet or npm error
    return null;
  }
}

/**
 * Get or set brand version
 */
const main = () => {
  const brand = getBrandName();

  if (!brand) {
    error("❌ Error: Brand name is required. Use --brand <brand-name>");
    process.exit(1);
  }

  // Try to get published version from npm
  const publishedVersion = getPublishedVersion(brand);

  if (publishedVersion) {
    log(`📦 Found published version for ${brand}: ${publishedVersion}`);
    console.log(publishedVersion);
  } else {
    log(`📦 No published version found for ${brand}, starting from 0.0.1`);
    console.log("0.0.1");
  }
};

main();

