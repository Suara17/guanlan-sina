import pandas as pd
import re

# 读取源CSV文件
df_source = pd.read_csv('test5 .csv', encoding='utf-8')

# 读取目标Excel文件以了解列顺序
df_target = pd.read_excel('data.xlsx')
target_columns = df_target.columns.tolist()

print("目标Excel的列顺序：", target_columns)
print("\n源CSV的列：", df_source.columns.tolist())

# 清理异常现象列：去掉"导致"及其后面的内容
def clean_anomaly(text):
    if pd.isna(text):
        return text
    # 去掉"导致"及其后面的内容
    text = str(text)
    # 查找"导致"的位置
    if '导致' in text:
        # 找到"导致"前面的内容
        parts = text.split('导致')
        return parts[0].strip().rstrip('，').rstrip(',')
    return text

# 应用清理函数
df_source['异常现象'] = df_source['异常现象'].apply(clean_anomaly)

# 按照目标Excel的列顺序重新排列
# 目标列顺序：产线类型, 序号, 原因编号, 原因内容, 异常现象, 临时解决办法, 长期解决办法
df_result = df_source[target_columns].copy()

# 保存到新的Excel文件（先保存到临时文件）
output_file = 'data_processed.xlsx'
df_result.to_excel(output_file, index=False, engine='openpyxl')

print(f"\n数据已整理完成，保存到：{output_file}")
print(f"总共处理了 {len(df_result)} 行数据")
print("\n前5行数据预览：")
print(df_result.head())
print("\n异常现象列示例（清理后）：")
print(df_result['异常现象'].head(10))
