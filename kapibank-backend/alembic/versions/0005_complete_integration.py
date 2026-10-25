"""Add profile data, immutable application snapshots and action versions."""
from alembic import op
import sqlalchemy as sa
revision = '0005_complete_integration'
down_revision = '0004_create_applications'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('profile', sa.JSON(), nullable=False, server_default='{}'))
    for column in [
        sa.Column('company_snapshot', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('info_requests', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('requested_principal', sa.Numeric(14, 2), nullable=True),
        sa.Column('requested_term_months', sa.Integer(), nullable=True),
        sa.Column('annual_rate', sa.Numeric(8, 6), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('offer_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('submission_key', sa.String(100), nullable=True),
        sa.Column('submission_hash', sa.String(64), nullable=True),
        sa.Column('comment', sa.String(1000), nullable=False, server_default=''),
        sa.Column('contact_email', sa.String(254), nullable=True),
    ]: op.add_column('applications', column)
    op.create_unique_constraint('uq_application_submission', 'applications', ['user_id', 'submission_key'])
    op.execute('UPDATE applications SET requested_principal = principal, requested_term_months = term_months')

def downgrade():
    op.drop_constraint('uq_application_submission', 'applications', type_='unique')
    for name in ['contact_email','comment','submission_hash','submission_key','offer_version','version','annual_rate','requested_term_months','requested_principal','info_requests','company_snapshot']:
        op.drop_column('applications', name)
    op.drop_column('users', 'profile')
