"""Persist owner-scoped assistant conversations and proposals."""
from alembic import op
import sqlalchemy as sa
revision='0006_assistant_sessions'
down_revision='0005_complete_integration'
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('assistant_conversations',sa.Column('id',sa.String(64),primary_key=True),sa.Column('owner',sa.String(100),nullable=False),sa.Column('messages',sa.JSON(),nullable=False),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False))
    op.create_index('ix_assistant_conversations_owner','assistant_conversations',['owner'])
    op.create_table('assistant_proposals',sa.Column('id',sa.String(64),primary_key=True),sa.Column('owner',sa.String(100),nullable=False),sa.Column('conversation_id',sa.String(64),nullable=False),sa.Column('target_field',sa.String(64),nullable=False),sa.Column('value',sa.JSON(),nullable=False),sa.Column('context_hash',sa.String(64),nullable=False),sa.Column('revision',sa.Integer(),nullable=False),sa.Column('confirmed',sa.Boolean(),nullable=False),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False))
    op.create_index('ix_assistant_proposals_owner','assistant_proposals',['owner'])

def downgrade():
    op.drop_table('assistant_proposals');op.drop_table('assistant_conversations')
