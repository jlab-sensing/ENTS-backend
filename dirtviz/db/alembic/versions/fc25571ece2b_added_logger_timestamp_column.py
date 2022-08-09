"""Added logger timestamp column

Revision ID: fc25571ece2b
Revises: 535eee3c4ba5
Create Date: 2022-08-09 14:35:16.745768

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fc25571ece2b'
down_revision = '535eee3c4ba5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('power_data', sa.Column('ts_logger', sa.DateTime(), nullable=False))
    op.add_column('teros_data', sa.Column('ts_logger', sa.DateTime(), nullable=False))
    op.alter_column('teros_data', 'ts',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('teros_data', 'ts',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
    op.drop_column('teros_data', 'ts_logger')
    op.drop_column('power_data', 'ts_logger')
    # ### end Alembic commands ###
