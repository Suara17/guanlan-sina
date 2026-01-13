const fs = require('fs');
const path = require('path');

// 获取当前工作目录和时间戳
const cwd = process.cwd();
const now = new Date();
const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
const workLogPath = path.join(cwd, 'WORK_LOG.md');
const readmePath = path.join(cwd, 'README.md');

// 获取任务摘要
const taskSummary = process.env.IFLOW_TASK_SUMMARY ||
                     process.env.IFLOW_CURRENT_TASK ||
                     '工具调用';

// 获取工具调用信息
const toolUsed = process.env.IFLOW_TOOL_USED || '';

// 记录频率控制：只在特定条件下记录
const shouldLog = () => {
  // 如果有明确的任务摘要，记录
  if (process.env.IFLOW_TASK_SUMMARY || process.env.IFLOW_CURRENT_TASK) {
    return true;
  }

  // 如果是重要工具，记录
  const importantTools = ['write_file', 'replace', 'run_shell_command', 'task'];
  if (toolUsed && importantTools.includes(toolUsed)) {
    return true;
  }

  // 否则不记录（避免过多小操作）
  return false;
};

// 如果不需要记录，直接返回
if (!shouldLog()) {
  console.log(`⏭️  跳过记录: ${toolUsed || '未知工具'}`);
  process.exit(0);
}

// 创建或更新 WORK_LOG.md
let workLogContent = '';
if (fs.existsSync(workLogPath)) {
  workLogContent = fs.readFileSync(workLogPath, 'utf-8');
}

// 智能总结逻辑：根据工具类型生成简洁的描述
const getOperationSummary = (tool) => {
  const summaries = {
    'write_file': '创建/更新文件',
    'replace': '修改文件内容',
    'read_file': '读取文件',
    'run_shell_command': '执行命令',
    'task': '执行代理任务',
    'todo_write': '更新任务列表',
    'search_file_content': '搜索文件内容',
    'glob': '查找文件'
  };
  return summaries[tool] || `使用 ${tool} 工具`;
};

// 添加新的工作日志记录
let newLogEntry = `## [${timestamp}]

**任务**: ${taskSummary}

**执行内容**:
- ${getOperationSummary(toolUsed)}
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
