# UI 组件库

本目录包含基础 UI 组件，基于 Radix UI 和 Tailwind CSS 构建，提供了一套可复用、可访问的组件。

## 组件列表

### alert.tsx
警告提示组件。

**功能：**
- 显示警告、错误、成功、信息等提示
- 支持关闭按钮
- 支持自定义图标

**使用示例：**
```typescript
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>错误</AlertTitle>
  <AlertDescription>操作失败，请重试</AlertDescription>
</Alert>
```

### avatar.tsx
头像组件。

**功能：**
- 显示用户头像
- 支持图片、首字母、图标
- 支持不同尺寸

**使用示例：**
```typescript
<Avatar>
  <AvatarImage src="/avatar.png" />
  <AvatarFallback>张</AvatarFallback>
</Avatar>
```

### badge.tsx
徽章组件。

**功能：**
- 显示状态标签
- 支持不同颜色和样式
- 支持自定义内容

**使用示例：**
```typescript
<Badge variant="default">默认</Badge>
<Badge variant="secondary">次要</Badge>
<Badge variant="destructive">危险</Badge>
<Badge variant="outline">轮廓</Badge>
```

### button.tsx
按钮组件。

**功能：**
- 多种样式变体
- 支持不同尺寸
- 支持加载状态
- 支持图标

**使用示例：**
```typescript
<Button variant="default">默认按钮</Button>
<Button variant="destructive">危险按钮</Button>
<Button variant="outline">轮廓按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="link">链接按钮</Button>
```

### button-group.tsx
按钮组组件。

**功能：**
- 将多个按钮组合在一起
- 支持分段选择器

**使用示例：**
```typescript
<ButtonGroup>
  <Button>选项 1</Button>
  <Button>选项 2</Button>
  <Button>选项 3</Button>
</ButtonGroup>
```

### card.tsx
卡片组件。

**功能：**
- 内容容器
- 包含标题、内容、底部等区域
- 支持不同样式

**使用示例：**
```typescript
<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述</CardDescription>
  </CardHeader>
  <CardContent>
    卡片内容
  </CardContent>
  <CardFooter>
    <Button>操作</Button>
  </CardFooter>
</Card>
```

### checkbox.tsx
复选框组件。

**功能：**
- 单选/多选
- 支持禁用状态
- 支持自定义样式

**使用示例：**
```typescript
<Checkbox id="terms" />
<label htmlFor="terms">同意条款</label>
```

### dialog.tsx
对话框组件。

**功能：**
- 模态对话框
- 支持多个触发器
- 支持自定义尺寸
- 支持动画效果

**使用示例：**
```typescript
<Dialog>
  <DialogTrigger>打开对话框</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>对话框标题</DialogTitle>
      <DialogDescription>对话框描述</DialogDescription>
    </DialogHeader>
    对话框内容
  </DialogContent>
</Dialog>
```

### dropdown-menu.tsx
下拉菜单组件。

**功能：**
- 下拉菜单
- 支持多级菜单
- 支持快捷键
- 支持图标

**使用示例：**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger>菜单</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>选项 1</DropdownMenuItem>
    <DropdownMenuItem>选项 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### form.tsx
表单组件。

**功能：**
- 表单布局
- 与 React Hook Form 集成
- 支持验证

**使用示例：**
```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>邮箱</FormLabel>
          <FormControl>
            <Input placeholder="请输入邮箱" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### input.tsx
输入框组件。

**功能：**
- 文本输入
- 支持不同类型
- 支持禁用状态

**使用示例：**
```typescript
<Input type="email" placeholder="请输入邮箱" />
```

### label.tsx
标签组件。

**功能：**
- 表单标签
- 支持关联输入框

**使用示例：**
```typescript
<Label htmlFor="email">邮箱</Label>
<Input id="email" />
```

### loading-button.tsx
加载按钮组件。

**功能：**
- 显示加载状态
- 禁用加载时的交互

**使用示例：**
```typescript
<LoadingButton loading={isLoading} onClick={handleSubmit}>
  提交
</LoadingButton>
```

### pagination.tsx
分页组件。

**功能：**
- 分页导航
- 支持跳转
- 支持每页数量选择

**使用示例：**
```typescript
<Pagination
  total={100}
  pageSize={10}
  currentPage={1}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

### password-input.tsx
密码输入框组件。

**功能：**
- 密码输入
- 显示/隐藏密码
- 密码强度提示

**使用示例：**
```typescript
<PasswordInput placeholder="请输入密码" />
```

### select.tsx
选择器组件。

**功能：**
- 下拉选择
- 支持搜索
- 支持多选
- 支持分组

**使用示例：**
```typescript
<Select>
  <SelectTrigger>
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">选项 1</SelectItem>
    <SelectItem value="2">选项 2</SelectItem>
  </SelectContent>
</Select>
```

### separator.tsx
分隔线组件。

**功能：**
- 内容分隔
- 支持水平/垂直方向

**使用示例：**
```typescript
<Separator />
```

### sheet.tsx
侧边面板组件。

**功能：**
- 从侧边滑出的面板
- 支持不同位置（左、右、上、下）
- 支持不同尺寸

**使用示例：**
```typescript
<Sheet>
  <SheetTrigger>打开面板</SheetTrigger>
  <SheetContent>
    面板内容
  </SheetContent>
</Sheet>
```

### sidebar.tsx
侧边栏组件。

**功能：**
- 应用侧边栏
- 支持折叠/展开
- 支持分组

**使用示例：**
```typescript
<Sidebar>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>菜单</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>菜单项</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

### skeleton.tsx
骨架屏组件。

**功能：**
- 加载占位符
- 支持不同形状和尺寸

**使用示例：**
```typescript
<Skeleton className="h-4 w-[250px]" />
```

### sonner.tsx
Toast 通知组件。

**功能：**
- 显示通知消息
- 支持多种类型（成功、错误、警告、信息）
- 支持堆叠和自动关闭

**使用示例：**
```typescript
import { toast } from 'sonner'

toast.success('操作成功')
toast.error('操作失败')
```

### table.tsx
表格组件。

**功能：**
- 数据表格
- 支持排序
- 支持选择
- 支持自定义列

**使用示例：**
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>名称</TableHead>
      <TableHead>状态</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>项目 1</TableCell>
      <TableCell>活跃</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### tabs.tsx
标签页组件。

**功能：**
- 标签页切换
- 支持垂直/水平布局
- 支持动画效果

**使用示例：**
```typescript
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">标签 1</TabsTrigger>
    <TabsTrigger value="tab2">标签 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    标签 1 内容
  </TabsContent>
  <TabsContent value="tab2">
    标签 2 内容
  </TabsContent>
</Tabs>
```

### tooltip.tsx
工具提示组件。

**功能：**
- 悬停显示提示
- 支持延迟
- 支持自定义位置

**使用示例：**
```typescript
<Tooltip>
  <TooltipTrigger>悬停我</TooltipTrigger>
  <TooltipContent>
    这是提示内容
  </TooltipContent>
</Tooltip>
```

## 设计原则

1. **可访问性**：所有组件都支持键盘导航和屏幕阅读器
2. **一致性**：保持统一的视觉风格和交互模式
3. **可定制**：通过 props 支持灵活的定制
4. **类型安全**：完整的 TypeScript 类型定义
5. **性能优化**：避免不必要的重渲染

## 技术栈

- **Radix UI**：无样式、可访问的 UI 原语
- **Tailwind CSS**：实用优先的 CSS 框架
- **class-variance-authority**：管理组件变体
- **clsx** & **tailwind-merge**：智能类名合并

## 注意事项

1. **不要直接修改**：这些组件是基础组件，如需定制请创建新的组件
2. **保持一致**：使用这些组件确保整个应用的视觉一致性
3. **文档完善**：为每个组件提供清晰的使用文档
4. **测试覆盖**：为核心组件编写测试
