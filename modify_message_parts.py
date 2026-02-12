import sys

file_path = 'src/components/message-parts.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Add imports
if 'useTTS' not in content:
    if 'import { useCopy }' in content:
        content = content.replace('import { useCopy } from "@/hooks/use-copy";', 'import { useCopy } from "@/hooks/use-copy";\nimport { useTTS } from "@/hooks/use-tts";')
    else:
        content = 'import { useTTS } from "@/hooks/use-tts";\n' + content

if 'Volume2' not in content:
    if 'Check,' in content:
        content = content.replace('Check,', 'Check, Volume2,')
    elif 'Check' in content: # If Check is imported differently
         pass

# Locate AssistMessagePart function body.
assist_start = content.find('export const AssistMessagePart = memo(function AssistMessagePart({')
if assist_start != -1:
    # Add hook call
    if 'const { copied, copy } = useCopy();' in content[assist_start:]:
        # Find where it is relative to assist_start
        hook_pos = content.find('const { copied, copy } = useCopy();', assist_start)
        if hook_pos != -1:
            hook_call = '\n  const { speak, stop, isPlaying, isLoading: isTTSLoading } = useTTS();'
            content = content[:hook_pos + len('const { copied, copy } = useCopy();')] + hook_call + content[hook_pos + len('const { copied, copy } = useCopy();'):]

    # Add button
    # Find Copy button inside AssistMessagePart
    # It has <TooltipContent>Copy</TooltipContent>
    # Note: UserMessagePart has side="bottom" usually.

    copy_tooltip_content = '<TooltipContent>Copy</TooltipContent>'
    copy_pos = content.find(copy_tooltip_content, assist_start)

    if copy_pos != -1:
        # Find the closing </Tooltip> tag after copy_pos
        tooltip_close_pos = content.find('</Tooltip>', copy_pos)
        if tooltip_close_pos != -1:
            insert_pos = tooltip_close_pos + len('</Tooltip>')

            tts_button = """
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-3! p-4!"
                onClick={() => isPlaying ? stop() : speak(part.text)}
                disabled={isTTSLoading}
              >
                {isTTSLoading ? <Loader className="animate-spin" /> : <Volume2 className={isPlaying ? "text-primary" : ""} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? "Stop" : "Read Aloud"}</TooltipContent>
          </Tooltip>"""

            content = content[:insert_pos] + tts_button + content[insert_pos:]

with open(file_path, 'w') as f:
    f.write(content)
