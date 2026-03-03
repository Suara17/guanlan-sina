import base64
import psycopg2

conn = psycopg2.connect(host='db', database='app', user='app', password='changethis')
cur = conn.cursor()

# 获取最新的轻工业任务图片
cur.execute("""
    SELECT id, name, industry_type, pareto_plot_image 
    FROM optimization_tasks 
    WHERE industry_type = 'LIGHT' AND pareto_plot_image IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 1
""")
row = cur.fetchone()
if row and row[3]:
    task_id, name, industry_type, image_data = row
    with open('/tmp/light_pareto.png', 'wb') as f:
        f.write(base64.b64decode(image_data))
    print(f'Task: {name} ({industry_type})')
    print(f'Task ID: {task_id}')
    print(f'Image saved, size: {len(image_data)} bytes (base64)')
else:
    print('No image found')
cur.close()
conn.close()
