import sys

file_path = 'src/components/chat-preferences-content.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Locate TTSSettingsContent and remove `const t = useTranslations();`
# The definition looks like:
# export function TTSSettingsContent() {
#   const [ttsSettings, appStoreMutate] = appStore(
#     useShallow((state) => [state.ttsSettings, state.mutate])
#   );
#   const t = useTranslations();

target_str = 'export function TTSSettingsContent() {'
idx = content.find(target_str)

if idx != -1:
    # Find the variable definition after this point
    var_def = 'const t = useTranslations();'
    var_idx = content.find(var_def, idx)

    if var_idx != -1:
        # Remove it
        content = content[:var_idx] + content[var_idx + len(var_def):]

with open(file_path, 'w') as f:
    f.write(content)
