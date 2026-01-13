const fs = require('fs');
const path = require('path');

// 获取当前工作目录
const cwd = process.cwd();

// 定义要读取的 README 文件列表（支持多个目录）
const readmeFiles = [
  { name: 'README.md', path: path.join(cwd, 'README.md') },
  { name: 'WORK_LOG.md', path: path.join(cwd, 'WORK_LOG.md') },
  { name: 'CLAUDE.md', path: path.join(cwd, 'CLAUDE.md') },
  { name: '启动指南.md', path: path.join(cwd, '启动指南.md') },
  { name: '项目代码结构说明.md', path: path.join(cwd, '项目代码结构说明.md') },
];

// 读取 backend 目录的 README
const backendReadme = path.join(cwd, 'backend', 'README.md');
if (fs.existsSync(backendReadme)) {
  readmeFiles.push({ name: 'backend/README.md', path: backendReadme });
}

// 读取 frontend 目录的 README
const frontendReadme = path.join(cwd, 'frontend', 'README.md');
if (fs.existsSync(frontendReadme)) {
  readmeFiles.push({ name: 'frontend/README.md', path: frontendReadme });
}

// 读取所有配置的文件
readmeFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    const content = fs.readFileSync(file.path, 'utf-8');
    console.log(`\n=== ${file.name} 内容 ===`);
    console.log(content);
    console.log(`=== ${file.name} 结束 ===\n`);
  } else {
    console.log(`未找到 ${file.name} 文件: ${file.path}`);
  }
});

// 显示环境变量信息（如果有）
if (process.env.IFLOW_USER_INPUT) {
  console.log(`\n=== 用户输入 ===`);
  console.log(process.env.IFLOW_USER_INPUT);
  console.log(`=== 用户输入结束 ===\n`);
}

if (process.env.IFLOW_CURRENT_TASK) {
  console.log(`\n=== 当前任务 ===`);
  console.log(process.env.IFLOW_CURRENT_TASK);
  console.log(`=== 当前任务结束 ===\n`);
}
