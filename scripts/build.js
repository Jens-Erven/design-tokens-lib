import { execSync } from "child_process";

/**
 * Get brand name from command line arguments or environment
 */
function getBrandName() {
  const args = process.argv.slice(2);
  const brandIndex = args.indexOf("--brand");
  
  if (brandIndex !== -1 && args[brandIndex + 1]) {
    return args[brandIndex + 1];
  }
  
  // Fallback to environment variable
  return process.env.BRAND || null;
}

const brand = getBrandName();
const brandArg = brand ? `--brand ${brand}` : "";

console.log(`🔨 Building design tokens${brand ? ` for brand: ${brand}` : ""}...\n`);

try {
  // Run each build step with brand parameter if provided
  console.log("📋 Step 1: Validating tokens...");
  execSync(`npm run validate ${brandArg}`, { stdio: "inherit" });
  
  console.log("\n📋 Step 2: Flattening tokens...");
  execSync(`npm run flatten:tokens ${brandArg}`, { stdio: "inherit" });
  
  console.log("\n📋 Step 3: Building variables...");
  execSync("npm run build:variables", { stdio: "inherit" });
  
  console.log("\n📋 Step 4: Building Tailwind CSS...");
  execSync("npm run build:tailwind", { stdio: "inherit" });
  
  console.log("\n📋 Step 5: Generating package.json...");
  execSync(`npm run generate:package ${brandArg}`, { stdio: "inherit" });
  
  console.log("\n✨ Build completed successfully!");
} catch (error) {
  console.error("\n❌ Build failed:", error.message);
  process.exit(1);
}

