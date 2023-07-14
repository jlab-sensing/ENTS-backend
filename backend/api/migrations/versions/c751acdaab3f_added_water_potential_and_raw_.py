"""added water potential and raw volumetric water content

Revision ID: c751acdaab3f
Revises: 88337765ad01
Create Date: 2023-06-02 15:38:36.412041

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c751acdaab3f"
down_revision = "88337765ad01"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("teros_data", sa.Column("raw_vwc", sa.Float(), nullable=True))
    op.add_column("teros_data", sa.Column("water_pot", sa.Float(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("teros_data", "water_pot")
    op.drop_column("teros_data", "raw_vwc")

    # ### end Alembic commands ###
