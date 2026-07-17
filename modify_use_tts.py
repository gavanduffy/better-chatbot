import sys

file_path = 'src/hooks/use-tts.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Fix type inference
if 'const chunks = [];' in content:
    content = content.replace('const chunks = [];', 'const chunks: string[] = [];')

with open(file_path, 'w') as f:
    f.write(content)
