import base64
import psycopg2

conn = psycopg2.connect(host='db', database='app', user='app', password='changethis')
cur = conn.cursor()
cur.execute("SELECT pareto_plot_image FROM optimization_tasks WHERE id = '46c122e3-cf51-456e-bd00-e30b29370aa4'")
row = cur.fetchone()
if row and row[0]:
    with open('/tmp/pareto_plot.png', 'wb') as f:
        f.write(base64.b64decode(row[0]))
    print('Saved to /tmp/pareto_plot.png, size:', len(row[0]), 'bytes (base64)')
else:
    print('No image found')
cur.close()
conn.close()
