const fs = require('fs');
const path = require('path');

// 获取当前工作目录
const cwd = process.cwd();
const readmePath = path.join(cwd, 'README.md');
const workLogPath = path.join(cwd, 'WORK_LOG.md');

// 读取 README.md
if (fs.existsSync(readmePath)) {
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  console.log('\n=== README.md 内容 ===');
  console.log(readmeContent);
  console.log('=== README.md 结束 ===\n');
} else {
  console.log(`未找到 README.md 文件: ${readmePath}`);
}

// 读取 WORK_LOG.md
if (fs.existsSync(workLogPath)) {
  const workLogContent = fs.readFileSync(workLogPath, 'utf-8');
  console.log('\n=== WORK_LOG.md 内容 ===');
  console.log(workLogContent);
  console.log('=== WORK_LOG.md 结束 ===\n');
} else {
  console.log(`未找到 WORK_LOG.md 文件: ${workLogPath}`);
}
