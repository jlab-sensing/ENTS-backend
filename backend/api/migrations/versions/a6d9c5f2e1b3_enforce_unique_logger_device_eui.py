"""enforce unique logger device eui

Revision ID: a6d9c5f2e1b3
Revises: 94004fb2d7c4
Create Date: 2026-02-16 14:22:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a6d9c5f2e1b3"
down_revision = "94004fb2d7c4"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # Normalize values so uniqueness is based on meaningful content.
    bind.execute(
        sa.text(
            """
            UPDATE logger
            SET device_eui = NULLIF(TRIM(device_eui), '')
            WHERE device_eui IS NOT NULL
            """
        )
    )

    # Stop if duplicates exist so data can be cleaned intentionally.
    duplicates = bind.execute(
        sa.text(
            """
            SELECT UPPER(TRIM(device_eui)) AS normalized_device_eui, COUNT(*) AS cnt
            FROM logger
            WHERE device_eui IS NOT NULL AND TRIM(device_eui) <> ''
            GROUP BY UPPER(TRIM(device_eui))
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC, normalized_device_eui
            LIMIT 5
            """
        )
    ).fetchall()

    if duplicates:
        duplicate_summary = ", ".join(f"{row[0]} ({row[1]})" for row in duplicates)
        raise RuntimeError(
            "Cannot enforce unique logger device_eui; duplicates found: "
            f"{duplicate_summary}"
        )

    op.execute(
        sa.text(
            """
            CREATE UNIQUE INDEX uq_logger_device_eui_norm
            ON logger (UPPER(TRIM(device_eui)))
            WHERE device_eui IS NOT NULL AND TRIM(device_eui) <> ''
            """
        )
    )


def downgrade():
    op.execute(sa.text("DROP INDEX IF EXISTS uq_logger_device_eui_norm"))
