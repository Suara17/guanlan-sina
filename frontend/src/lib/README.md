# 工具库目录

本目录包含应用中使用的工具函数和辅助方法。

## 文件说明

### utils.ts
通用的工具函数集合。

**主要功能：**

#### cn() - 类名合并函数
基于 `clsx` 和 `tailwind-merge` 实现的智能类名合并工具。

**功能：**
- 合并多个类名字符串
- 自动处理 Tailwind CSS 类名冲突
- 支持条件类名

**使用示例：**
```typescript
import { cn } from '@/lib/utils'

// 基本使用
cn('px-4 py-2', 'bg-blue-500')

// 条件类名
cn('base-class', isActive && 'active-class', isError && 'error-class')

// 处理冲突（后面的类名会覆盖前面的）
cn('px-4', 'px-8') // 结果: 'px-8'
```

**为什么需要这个函数？**
- Tailwind CSS 的类名有优先级，直接字符串拼接可能导致样式冲突
- 使用 `tailwind-merge` 可以智能处理这些冲突，确保最终样式符合预期
- 结合 `clsx` 可以方便地处理条件类名

## 扩展建议

如果需要添加更多工具函数，可以在此目录中创建新文件，例如：
- `date-utils.ts` - 日期处理工具
- `string-utils.ts` - 字符串处理工具
- `validation-utils.ts` - 表单验证工具
- `format-utils.ts` - 格式化工具

## 注意事项

1. **保持纯净**：工具函数应该是纯函数，不依赖外部状态
2. **类型安全**：为所有函数提供完整的 TypeScript 类型定义
3. **文档完善**：为复杂函数添加 JSDoc 注释
4. **测试覆盖**：为工具函数编写单元测试
