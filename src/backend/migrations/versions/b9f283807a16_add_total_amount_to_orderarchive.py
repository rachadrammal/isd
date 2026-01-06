"""Add total_amount to OrderArchive

Revision ID: b9f283807a16
Revises: 
Create Date: 2026-01-03 13:42:48.735421

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b9f283807a16'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('order_archive',
        sa.Column('total_amount', sa.Numeric(10, 2))
    )
    
    def downgrade():
        op.drop_column('order_archive', 'total_amount')
        
def upgrade() -> None:
       op.add_column('alerts', sa.Column('new_column_name', sa.String(255), nullable=True))


def downgrade() -> None:
       op.drop_column('alerts', 'new_column_name')        
