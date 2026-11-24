"""added_logger_user_table

Revision ID: 9f53e9f3c649
Revises: 14612231efb8
Create Date: 2026-11-23 10:06:47.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9f53e9f3c649'
down_revision = '14612231efb8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('logger_user',
    sa.Column('logger_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.ForeignKeyConstraint(['logger_id'], ['logger.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('logger_id', 'user_id')
    )


def downgrade():
    op.drop_table('logger_user')
