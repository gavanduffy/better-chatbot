import sys

file_path = 'src/components/chat-preferences-content.tsx'

with open(file_path, 'r') as f:
    content = f.read()

imports_to_add = [
    'import { appStore } from "@/app/store";',
    'import { useShallow } from "zustand/shallow";'
]

new_imports = []
for imp in imports_to_add:
    if imp not in content:
        new_imports.append(imp)

if new_imports:
    # Insert after "use client";
    if '"use client";' in content:
        content = content.replace('"use client";', '"use client";\n' + '\n'.join(new_imports))
    else:
        content = '\n'.join(new_imports) + '\n' + content

new_component = """

export function TTSSettingsContent() {
  const [ttsSettings, appStoreMutate] = appStore(
    useShallow((state) => [state.ttsSettings, state.mutate])
  );
  const t = useTranslations();

  const handleUpdate = (updates: Partial<typeof ttsSettings>) => {
    appStoreMutate({
      ttsSettings: { ...ttsSettings, ...updates },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-xl font-semibold">TTS Settings</h3>
      <p className="text-sm text-muted-foreground pb-4">
        Configure the Text-to-Speech settings using an OpenAI-compatible API.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input
            value={ttsSettings?.baseUrl || ""}
            onChange={(e) => handleUpdate({ baseUrl: e.target.value })}
            placeholder="https://api.openai.com"
          />
        </div>

        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            value={ttsSettings?.apiKey || ""}
            onChange={(e) => handleUpdate({ apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Input
            value={ttsSettings?.model || ""}
            onChange={(e) => handleUpdate({ model: e.target.value })}
            placeholder="tts-1"
          />
        </div>
      </div>
    </div>
  );
}
"""

if 'export function TTSSettingsContent' not in content:
    content += new_component

with open(file_path, 'w') as f:
    f.write(content)
