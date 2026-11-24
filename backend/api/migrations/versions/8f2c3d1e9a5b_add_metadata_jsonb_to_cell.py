"""add metadata jsonb to cell

Revision ID: 8f2c3d1e9a5b
Revises: 14612231efb8
Create Date: 2026-11-12 15:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "8f2c3d1e9a5b"
down_revision = "14612231efb8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("cell", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "metadata",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'{}'::jsonb"),
                nullable=True,
            )
        )


def downgrade():
    with op.batch_alter_table("cell", schema=None) as batch_op:
        batch_op.drop_column("metadata")
