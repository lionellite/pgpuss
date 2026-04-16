import sys

def solve():
    with open('frontend/src/pages/public/DepotPage.jsx', 'r') as f:
        lines = f.readlines()

    output = []
    skip = False
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            skip = False
            continue
        if line.startswith('======='):
            skip = True
            continue
        if line.startswith('>>>>>>> main'):
            skip = False
            continue
        if not skip:
            output.append(line)

    with open('frontend/src/pages/public/DepotPage.jsx', 'w') as f:
        f.writelines(output)

if __name__ == '__main__':
    solve()
