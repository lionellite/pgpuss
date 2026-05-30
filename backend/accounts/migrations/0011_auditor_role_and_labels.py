# Generated manually — rôle AUDITEUR et libellés alignés pyramide sanitaire

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_pfzs_callcenter_pnuss'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('USAGER', 'Plaignant'),
                    ('PFE', 'Point Focal Établissement (PFE)'),
                    ('AGENT_INTERNE', 'Agent interne / Agent traitant'),
                    ('PFZS', 'Point Focal Zone Sanitaire (PFZS)'),
                    ('DDS', 'Point Focal Départemental (PF-DDS)'),
                    ('DQSS', 'Point Focal National (PF-DQSS)'),
                    ('CABINET', 'Ministère de la Santé (Cabinet)'),
                    ('DIRECTEUR_EST', "Direction de l'établissement"),
                    ('PNUSS', 'Représentant PNUSS'),
                    ('AGENT_CALL_CENTER', 'Agent Call Center (136)'),
                    ('ADMIN_PLATEFORME', 'Administrateur national'),
                    ('AUDITEUR', 'Auditeur / Superviseur (lecture seule)'),
                ],
                default='USAGER',
                max_length=30,
            ),
        ),
    ]
