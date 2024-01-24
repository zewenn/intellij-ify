import os
import re


def read_file(file):
    with open(file, "r") as rf:
        return rf.read()


js = f'`<script>\n{read_file(os.path.join(".resources", "index.js"))}\n</script>`'
css = f'`<style>\n{read_file(os.path.join(".resources", "index.css"))}\n</style>`'



def replace_text_between_strings(input_file, output_file, start_string, end_string, replacement_text):
    # Read the content from the input file
    content = read_file(input_file)

    # Use a regular expression to find and replace text between start and end strings
    pattern = re.compile(f'{re.escape(start_string)}(.*?){re.escape(end_string)}', re.DOTALL)
    modified_content = re.sub(pattern, replacement_text, content)

    # Write the modified content back to the output file
    with open(output_file, 'w') as file:
        file.write(modified_content)

if __name__ == "__main__":
    input_file = os.path.join(".resources", "extension.js")
    output_file = os.path.join("src", "extension.js")
    start_string = "/* [RESOURCE-BUILDER-START] */"
    end_string = "/* [RESOURCE-BUILDER-END] */"
    replacement_text = f'{js} + {css} +'

    replace_text_between_strings(input_file, output_file, start_string, end_string, replacement_text)
