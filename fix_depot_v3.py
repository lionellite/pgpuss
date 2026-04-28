import sys
import re

def solve():
    with open('frontend/src/pages/public/DepotPage.jsx', 'r') as f:
        content = f.read()

    # 1. Resolve merge conflicts (taking HEAD)
    content = re.sub(r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> main', r'\1', content, flags=re.DOTALL)

    # 2. Add id/htmlFor to form fields
    # Region
    content = content.replace('<label className="form-label">Région</label>', '<label className="form-label" htmlFor="region-select">Région</label>')
    content = content.replace('<select className="form-select" value={selectedRegion}', '<select id="region-select" className="form-select" value={selectedRegion}')

    # Establishment
    content = content.replace('<label className="form-label">Établissement *</label>', '<label className="form-label" htmlFor="est-select">Établissement *</label>')
    content = content.replace('<select className="form-select" {...register(\'establishment\'', '<select id="est-select" className="form-select" {...register(\'establishment\'')

    # Title
    content = content.replace('<label className="form-label">Titre de la plainte *</label>', '<label className="form-label" htmlFor="title-input">Titre de la plainte *</label>')
    content = content.replace('<input className="form-input" placeholder="Résumez votre plainte"', '<input id="title-input" className="form-input" placeholder="Résumez votre plainte"')

    # 3. Add ARIA to icon buttons
    content = content.replace('<FiUpload style={{ fontSize: \'1.5rem\', color: \'#8FA3BF\' }} />', '<FiUpload style={{ fontSize: \'1.5rem\', color: \'#8FA3BF\' }} aria-hidden="true" />')

    # 4. Wrap steps in <nav>
    content = content.replace('<div className="steps" style={{ marginBottom: \'3rem\' }}>', '<nav aria-label="Étapes de la plainte" className="steps" style={{ marginBottom: \'3rem\' }}>')
    content = content.replace('</div>\n\n          <div className="glass-card"', '</nav>\n\n          <div className="glass-card"')

    with open('frontend/src/pages/public/DepotPage.jsx', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    solve()
