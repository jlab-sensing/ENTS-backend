"""Added sensor and data tables

Revision ID: 74f0f195babd
Revises: c7c5894af080
Create Date: 2024-01-19 12:36:13.616466

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '74f0f195babd'
down_revision = 'c7c5894af080'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('data',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('sensor_id', sa.Integer(), nullable=False),
    sa.Column('ts', sa.DateTime(), nullable=False),
    sa.Column('ts_server', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('float_val', sa.Float(), nullable=True),
    sa.Column('int_val', sa.Integer(), nullable=True),
    sa.Column('text_val', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['sensor_id'], ['cell.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('sensor',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('cell_id', sa.Integer(), nullable=False),
    sa.Column('measurement', sa.Text(), nullable=False),
    sa.Column('data_type', sa.Text(), nullable=False),
    sa.Column('unit', sa.Text(), nullable=True),
    sa.Column('name', sa.Text(), nullable=False),
    sa.ForeignKeyConstraint(['cell_id'], ['cell.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('sensor')
    op.drop_table('data')
    # ### end Alembic commands ###