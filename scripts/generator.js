const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const OUTPUT_FILE = "PROJECT_BLUEPRINT.md";
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
];
const IGNORE_FILES = [
  "pnpm-lock.yaml",
  "yarn.lock",
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
];

function getFileLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".sql": "sql",
    ".json": "json",
    ".css": "css",
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

function getAllFiles(dirPath, arrayOfFiles = []) {
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

function generateBlueprint() {
  let content = `# PROJECT BLUEPRINT\nGenerated: ${new Date().toLocaleString()}\n\n`;

  // File Contents
  content += `## 2. FILE CONTENTS\n`;
  const files = getAllFiles(process.cwd());

  files.forEach((file) => {
    const lang = getFileLanguage(file);
    const fileData = fs.readFileSync(file, "utf8");

    content += `### Path: ${file}\n`;
    content += `\`\`\`${lang}\n`;
    content += fileData;
    content += `\n\`\`\`\n\n`;
  });

  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`Success: ${OUTPUT_FILE} generated.`);
}

generateBlueprint();
