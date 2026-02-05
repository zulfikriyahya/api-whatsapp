const fs = require("fs");
const path = require("path");
const OUTPUT_FILE = "PROJECT_BLUEPRINT.md";

const FRONTEND_DIRS = [
  "src/app/(auth)",
  "src/app/(dashboard)",
  "src/components",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/providers.tsx",
  "src/app/error.tsx",
  "src/app/loading.tsx",
  "src/app/not-found.tsx",
  "postcss.config.js",
  "tailwind.config.ts",
  "next.config.js",
];

const BACKEND_DIRS = [
  "src/app/api",
  "src/lib/auth",
  "src/lib/db",
  "src/lib/services",
  "src/lib/utils",
  "src/lib/validations",
  "src/lib/whatsapp",
  "src/lib/api-middlewares",
  "src/lib/docs",
  "src/config",
  "src/middleware.ts",
  "src/types",
  "database",
];

const IGNORE_DIRS = [
  "node_modules",
  ".git",
  ".next",
  ".swc",
  "sessions",
  "src/tests",
  "tests",
  "uploads",
  ".wwebjs_auth",
  ".wwebjs_cache",
  "dist",
  "build",
  "coverage",
];

const IGNORE_FILES = [
  "pnpm-lock.yaml",
  "yarn.lock",
  "package-lock.json",
  "PROJECT_BLUEPRINT.md",
  "README.md",
  "TODO.md",
  "Dockerfile",
  "docker-compose.yml",
  ".yarnrc",
  ".gitignore",
  ".npmrc",
  "jest.config.js",
  "jest.setup.js",
  "playwright.config.js",
  "playwright.config.ts",
  "generator.js",
  "tree",
  "next-env.d.ts",
  "empty-module.ts",
];

function getFileLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".sql": "sql",
    ".prisma": "prisma",
    ".json": "json",
    ".css": "css",
    ".scss": "scss",
    ".html": "html",
    ".md": "markdown",
  };
  return map[ext] || "text";
}

function shouldIgnore(fileName, filePath) {
  if (fileName.startsWith(".") && fileName !== ".env.example") return true;
  if (IGNORE_FILES.includes(fileName)) return true;
  return IGNORE_DIRS.some(
    (dir) =>
      filePath.includes(path.sep + dir + path.sep) ||
      filePath.startsWith(dir + path.sep),
  );
}

function isFrontendFile(filePath) {
  return FRONTEND_DIRS.some((dir) => {
    const normalizedDir = dir.replace(/\\/g, "/");
    const normalizedPath = filePath.replace(/\\/g, "/");
    return (
      normalizedPath.startsWith(normalizedDir) ||
      normalizedPath === normalizedDir
    );
  });
}

function isBackendFile(filePath) {
  return BACKEND_DIRS.some((dir) => {
    const normalizedDir = dir.replace(/\\/g, "/");
    const normalizedPath = filePath.replace(/\\/g, "/");
    return (
      normalizedPath.startsWith(normalizedDir) ||
      normalizedPath === normalizedDir
    );
  });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const stat = fs.statSync(dirPath);

  if (stat.isFile()) {
    const relativePath = path.relative(process.cwd(), dirPath);
    if (!shouldIgnore(path.basename(dirPath), relativePath)) {
      arrayOfFiles.push(relativePath);
    }
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const relativePath = path.relative(process.cwd(), filePath);

    if (fs.statSync(filePath).isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      if (!shouldIgnore(file, relativePath)) {
        arrayOfFiles.push(relativePath);
      }
    }
  });
  return arrayOfFiles;
}

function getFilesForSection(dirs, checkFunc) {
  let files = [];
  dirs.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    files = files.concat(getAllFiles(dirPath));
  });
  return files.filter(checkFunc);
}

function generateFileContents(files) {
  let content = "";
  files.forEach((file) => {
    const lang = getFileLanguage(file);
    try {
      const fileData = fs.readFileSync(file, "utf8");
      content += `### Path: ${file}\n`;
      content += `\`\`\`${lang}\n`;
      content += fileData;
      content += `\n\`\`\`\n\n`;
    } catch (error) {
      console.log(`Skipping file: ${file} (Error: ${error.message})`);
    }
  });
  return content;
}

function generateBlueprint() {
  let content = `# PROJECT BLUEPRINT\nGenerated: ${new Date().toLocaleString()}\n\n`;

  // Frontend Section
  content += `## FRONTEND\n\n`;
  content += `### Description\n`;
  content += `UI components, pages, layouts, styling, and client-side logic.\n\n`;
  const frontendFiles = getFilesForSection(FRONTEND_DIRS, isFrontendFile);
  console.log(`Frontend files found: ${frontendFiles.length}`);
  content += generateFileContents(frontendFiles);

  // Backend Section
  content += `## BACKEND\n\n`;
  content += `### Description\n`;
  content += `API routes, database, services, authentication, middleware, and server-side logic.\n\n`;
  const backendFiles = getFilesForSection(BACKEND_DIRS, isBackendFile);
  console.log(`Backend files found: ${backendFiles.length}`);
  content += generateFileContents(backendFiles);

  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`\nSuccess: ${OUTPUT_FILE} generated.`);
}

generateBlueprint();
