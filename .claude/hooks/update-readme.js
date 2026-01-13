const fs = require('fs');
const path = require('path');

// 获取当前工作目录和时间戳
const cwd = process.cwd();
const now = new Date();
const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
const workLogPath = path.join(cwd, 'WORK_LOG.md');
const readmePath = path.join(cwd, 'README.md');

// 获取命令行参数（任务摘要）
const taskSummary = process.argv[2] || '工作会话结束';

// 创建或更新 WORK_LOG.md
let workLogContent = '';
if (fs.existsSync(workLogPath)) {
  workLogContent = fs.readFileSync(workLogPath, 'utf-8');
}

// 添加新的工作日志记录
const newLogEntry = `## [${timestamp}]

**任务**: ${taskSummary}

**执行内容**:
- 由 iFlow CLI 自动记录
- 工作目录: ${cwd.replace(/\\/g, '/')}

**状态**: ✅ 已完成

---

`;

// 追加到 WORK_LOG.md
fs.writeFileSync(workLogPath, workLogContent + newLogEntry, 'utf-8');
console.log(`✅ 已更新 WORK_LOG.md: ${workLogPath}`);

// 更新 README.md 中的"最后更新"时间
if (fs.existsSync(readmePath)) {
  let readmeContent = fs.readFileSync(readmePath, 'utf-8');

  // 查找并更新各种格式的"最后更新"标记
  const patterns = [
    /\*\*最后更新\*\*:.*/g,
    /\*\*Last Updated\*\*:.*/g,
    /最后更新:.*/g,
    /Last Updated:.*/g
  ];

  let updated = false;
  for (const pattern of patterns) {
    if (pattern.test(readmeContent)) {
      readmeContent = readmeContent.replace(pattern, `**最后更新**: ${timestamp}`);
      updated = true;
      break;
    }
  }

  // 如果没有找到"最后更新"标记，在文件末尾添加
  if (!updated) {
    readmeContent += `\n\n---\n\n**最后更新**: ${timestamp}\n`;
  }

  fs.writeFileSync(readmePath, readmeContent, 'utf-8');
  console.log(`✅ 已更新 README.md: ${readmePath}`);
} else {
  console.log(`⚠️  未找到 README.md: ${readmePath}`);
}
