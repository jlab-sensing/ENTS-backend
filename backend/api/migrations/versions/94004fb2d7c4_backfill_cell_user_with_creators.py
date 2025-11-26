"""backfill_cell_user_with_creators

Revision ID: 94004fb2d7c4
Revises: 47822a5f0b44
Create Date: 2025-11-17 05:37:26.237380

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "94004fb2d7c4"
down_revision = "47822a5f0b44"
branch_labels = None
depends_on = None


def upgrade():
    # Backfill cell_user table with creators for all existing cells
    # This ensures that cell creators have access to their cells via the relationship
    op.execute(
        """
        INSERT INTO cell_user (cell_id, user_id)
        SELECT c.id, c.user_id
        FROM cell c
        WHERE c.user_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM cell_user cu
            WHERE cu.cell_id = c.id AND cu.user_id = c.user_id
        )
    """
    )


def downgrade():
    # Remove the backfilled creator relationships
    # This only removes entries where user_id matches the cell's creator
    op.execute(
        """
        DELETE FROM cell_user
        WHERE (cell_id, user_id) IN (
            SELECT c.id, c.user_id
            FROM cell c
            WHERE c.user_id IS NOT NULL
        )
    """
    )
