import sys

file_path = 'src/components/chat-preferences-popup.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Add imports
if 'UserIcon, X, Share2' in content:
    content = content.replace('UserIcon, X, Share2', 'UserIcon, X, Share2, AudioLines')

if 'ExportsManagementContent,' in content:
    content = content.replace('ExportsManagementContent,', 'ExportsManagementContent,\n  TTSSettingsContent,')

# Add tab
new_tab = """
      {
        label: "TTS Settings",
        icon: <AudioLines className="w-4 h-4" />,
      },"""

if 'myExports' in content:
    # Find the end of the exports tab object
    split_str = 'icon: <Share2 className="w-4 h-4" />,\n      },'
    if split_str in content:
        content = content.replace(split_str, split_str + new_tab)
    else:
        # Try a more robust search if formatting differs
        pass

# Add render logic
render_logic = """                        ) : tab == 2 ? (
                          <ExportsManagementContent />
                        ) : tab == 3 ? (
                          <TTSSettingsContent />
                        ) : null}"""

if 'ExportsManagementContent />\n                        ) : null}' in content:
    content = content.replace('ExportsManagementContent />\n                        ) : null}', 'ExportsManagementContent />\n' + render_logic.replace('                        ) : tab == 2 ? (\n                          <ExportsManagementContent />\n', '')) # Be careful with replacement

# Alternative replacement strategy
original_render = """                        ) : tab == 2 ? (
                          <ExportsManagementContent />
                        ) : null}"""

if original_render in content:
    content = content.replace(original_render, render_logic)

with open(file_path, 'w') as f:
    f.write(content)
