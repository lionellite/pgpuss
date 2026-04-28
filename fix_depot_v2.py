import sys
import re

def solve():
    with open('frontend/src/pages/public/DepotPage.jsx', 'r') as f:
        content = f.read()

    # Simple regex to take HEAD side and discard main side
    # <<<<<<< HEAD
    # HEAD content
    # =======
    # main content
    # >>>>>>> main

    new_content = re.sub(r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> main', r'\1', content, flags=re.DOTALL)

    # Some markers might not have newline before/after if they are inline (rare but possible)
    # Let's check if any markers remain
    if '<<<<<<<' in new_content:
        print("Warning: some markers remain")

    with open('frontend/src/pages/public/DepotPage.jsx', 'w') as f:
        f.write(new_content)

if __name__ == '__main__':
    solve()
