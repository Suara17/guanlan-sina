# Word 文档处理问题与解决方案指南

本文档记录了在处理 `v4天工·弈控 —— 面向离散制造的"视-空协同"智能系统2.10 - 副本.docx` 文件过程中遇到的问题及解决方案。

## 目录

1. [文件路径编码问题](#1-文件路径编码问题)
2. [读取文档内容](#2-读取文档内容)
3. [创建三线表](#3-创建三线表)
4. [设置表格边框](#4-设置表格边框)
5. [表格定位插入](#5-表格定位插入)
6. [完整代码示例](#6-完整代码示例)

---

## 1. 文件路径编码问题

### 问题

Windows 系统下，包含中文路径的 docx 文件直接使用 `Document()` 打开时失败：

```python
from docx import Document
doc = Document(r'E:\Guanlan-Sina\docs\项目介绍\v4天工·弈控...docx')
# 报错: PackageNotFoundError
```

### 解决方案

将文件复制为临时简单名称：

```python
import shutil
import os

os.chdir(r'E:\Guanlan-Sina\docs\项目介绍')
files = os.listdir('.')
for f in files:
    if f.startswith('v4') and '副本' in f and f.endswith('.docx'):
        shutil.copy(f, 'temp_v4.docx')
```

---

## 2. 读取文档内容

### 问题

直接打印段落内容时，控制台输出乱码（编码问题）。

### 解决方案

将读取内容保存到文件，再使用 Read 工具查看：

```python
from docx import Document

doc = Document('temp_v4.docx')

found = False
content = []
for para in doc.paragraphs:
    text = para.text.strip()
    if '关系类型设计' in text:
        found = True
    if found and text:
        content.append(text)
        if len(content) > 1 and text[0].isdigit() and '关系类型设计' not in text:
            content.pop()
            break

# 保存到txt文件
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(content))
```

---

## 3. 创建三线表

### 解决方案

```python
from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document('input.docx')

# 定义表格数据
table_data = [
    ['关系类型', '含义', '连接实体', '关系属性'],
    ['CAUSED_BY\n（由……导致）', '连接异常现象与根本原因', '异常 ↔ 根因', '属性1\n属性2'],
    # ... 更多行
]

# 创建表格
table = doc.add_table(rows=7, cols=4)
table.style = 'Light Grid Accent 1'

# 设置表头
headers = ['关系类型', '含义', '连接实体', '关系属性']
for i, header in enumerate(headers):
    table.rows[0].cells[i].text = header
    for p in table.rows[0].cells[i].paragraphs:
        for r in p.runs:
            r.font.bold = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

# 填充数据
for row_idx, row_data in enumerate(table_data[1:], start=1):
    for col_idx, cell_data in enumerate(row_data):
        table.rows[row_idx].cells[col_idx].text = cell_data
```

---

## 4. 设置表格边框

### 问题

设置边框时类型错误：

```python
# 错误写法
edge_data.set(qn('w:sz'), kwargs[edge])  # 传入int类型
```

### 解决方案

将数值转换为字符串：

```python
def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        if edge in kwargs:
            edge_data = OxmlElement(f'w:{edge}')
            edge_data.set(qn('w:val'), 'single')
            edge_data.set(qn('w:sz'), str(kwargs[edge]))  # 转为字符串
            edge_data.set(qn('w:space'), '0')
            edge_data.set(qn('w:color'), '000000')
            tcBorders.append(edge_data)
    tcPr.append(tcBorders)
```

**边框宽度对照表**：

| 磅值 | sz值 |
|------|------|
| 0.5磅 | 4 |
| 1磅 | 8 |
| 1.5磅 | 12 |
| 2磅 | 16 |
| 3磅 | 24 |

---

## 5. 表格定位插入

### 问题

直接使用 `doc.add_table()` 会将表格添加到文档末尾，无法精确定位到指定章节后。

### 解决方案

分步处理：

1. 找到目标章节位置
2. 创建新文档
3. 复制目标位置之前的内容
4. 插入表格
5. 复制剩余内容

```python
from docx import Document

src_doc = Document('source.docx')

# 找到目标章节位置
target_idx = None
for i, para in enumerate(src_doc.paragraphs):
    if '关系类型设计' in para.text:
        target_idx = i
        break

# 找到章节结束位置
end_idx = target_idx + 1
for i in range(target_idx + 1, len(src_doc.paragraphs)):
    text = src_doc.paragraphs[i].text.strip()
    if text and text[0].isdigit() and '关系类型设计' not in text:
        end_idx = i
        break

# 创建新文档
new_doc = Document()

# 复制目标位置之前的内容
for i in range(target_idx + 1):
    para = src_doc.paragraphs[i]
    if para.text.strip():
        new_doc.add_paragraph(para.text)

# 在此处插入表格 (使用前面的代码创建表格)
table = new_doc.add_table(...)

# 复制剩余内容
for i in range(end_idx + 1, len(src_doc.paragraphs)):
    para = src_doc.paragraphs[i]
    if para.text.strip():
        new_doc.add_paragraph(para.text)

new_doc.save('output.docx')
```

---

## 6. 完整代码示例

以下是将文档某节内容转换为三线表的完整流程：

```python
# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        if edge in kwargs:
            edge_data = OxmlElement(f'w:{edge}')
            edge_data.set(qn('w:val'), 'single')
            edge_data.set(qn('w:sz'), str(kwargs[edge]))
            edge_data.set(qn('w:space'), '0')
            edge_data.set(qn('w:color'), '000000')
            tcBorders.append(edge_data)
    tcPr.append(tcBorders)

def set_table_border(table, **kwargs):
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement('w:tblPr')
    tblBorders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        if edge in kwargs:
            edge_data = OxmlElement(f'w:{edge}')
            edge_data.set(qn('w:val'), 'single')
            edge_data.set(qn('w:sz'), str(kwargs[edge]))
            edge_data.set(qn('w:space'), '0')
            edge_data.set(qn('w:color'), '000000')
            tblBorders.append(edge_data)
    tblPr.append(tblBorders)
    if tbl.tblPr is None:
        tbl.insert(0, tblPr)

# 读取源文档
src_doc = Document('source.docx')

# 查找目标章节
target_idx = None
for i, para in enumerate(src_doc.paragraphs):
    if '目标章节标题' in para.text:
        target_idx = i
        break

# 找到结束位置
end_idx = target_idx + 1
for i in range(target_idx + 1, len(src_doc.paragraphs)):
    text = src_doc.paragraphs[i].text.strip()
    if text and text[0].isdigit():
        end_idx = i
        break

# 表格数据
table_data = [
    ['列1', '列2', '列3'],
    ['数据1', '数据2', '数据3'],
]

# 创建新文档
new_doc = Document()

# 复制之前内容
for i in range(target_idx + 1):
    para = src_doc.paragraphs[i]
    if para.text.strip():
        new_doc.add_paragraph(para.text)

# 创建表格
table = new_doc.add_table(rows=len(table_data), cols=len(table_data[0]))
table.style = 'Light Grid Accent 1'

# 填充表头
for i, header in enumerate(table_data[0]):
    table.rows[0].cells[i].text = header

# 填充数据
for row_idx, row_data in enumerate(table_data[1:], start=1):
    for col_idx, cell_data in enumerate(row_data):
        table.rows[row_idx].cells[col_idx].text = cell_data

# 设置1.5磅边框
border_size = 12
set_table_border(table, top=border_size, left=border_size, 
                 bottom=border_size, right=border_size, 
                 insideH=border_size, insideV=border_size)

for cell in table.rows[0].cells:
    set_cell_border(cell, top=border_size, left=border_size, 
                    bottom=border_size, right=border_size)

for row_idx in range(1, len(table.rows)):
    for cell in table.rows[row_idx].cells:
        set_cell_border(cell, top=border_size, bottom=border_size)

# 复制之后内容
for i in range(end_idx + 1, len(src_doc.paragraphs)):
    para = src_doc.paragraphs[i]
    if para.text.strip():
        new_doc.add_paragraph(para.text)

new_doc.save('output.docx')
print('Done!')
```

---

## 注意事项

1. **文件备份**：修改文档前先备份原始文件
2. **编码处理**：Windows 下处理中文路径时，先复制为临时文件名
3. **调试输出**：将输出写入文件而非直接打印，避免控制台编码问题
4. **边框单位**：Word 中边框宽度以 1/8 磅为单位，1.5磅 = 12
5. **表格样式**：优先使用内置样式 `Light Grid Accent 1`，再自定义边框
