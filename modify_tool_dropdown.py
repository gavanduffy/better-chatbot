import sys

file_path = 'src/components/tool-select-dropdown.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Add imports
if 'Wrench,' in content:
    content = content.replace('Wrench,', 'Wrench,\n  Palette,\n  Presentation,')

# Add cases to switch
case_visualization = 'case AppDefaultToolkit.Visualization:'
new_cases = """
        case AppDefaultToolkit.Canvas:
          icon = Palette;
          break;
        case AppDefaultToolkit.Slides:
          icon = Presentation;
          break;"""

if case_visualization in content:
    # Find where the switch ends or where to insert.
    # We can insert before the Visualization case or after the Code case.
    if 'case AppDefaultToolkit.Code:' in content:
        split_point = 'case AppDefaultToolkit.Code:'
        parts = content.split(split_point)
        # Find the break; after Code case
        sub_parts = parts[1].split('break;')
        # Reconstruct: part[0] + 'case Code:' + sub_parts[0] + 'break;' + new_cases + sub_parts[1...]
        content = parts[0] + split_point + sub_parts[0] + 'break;' + new_cases + 'break;'.join(sub_parts[1:])

with open(file_path, 'w') as f:
    f.write(content)
