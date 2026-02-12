import sys

file_path = 'src/components/chat-preferences-content.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Locate TTSSettingsContent
if 'export function TTSSettingsContent() {' in content:
    # Remove unused  definition
    if 'const t = useTranslations();' in content:
         # Note:  is used in other functions in this file.
         # We need to target the one inside TTSSettingsContent.
         # Since we append TTSSettingsContent at the end, it should be the last occurrence.

         parts = content.split('export function TTSSettingsContent() {')
         if len(parts) > 1:
             tts_part = parts[1]
             if 'const t = useTranslations();' in tts_part:
                 tts_part = tts_part.replace('const t = useTranslations();', '')
                 content = parts[0] + 'export function TTSSettingsContent() {' + tts_part

with open(file_path, 'w') as f:
    f.write(content)
