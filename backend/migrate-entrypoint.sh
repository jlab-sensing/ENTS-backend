#!/bin/sh

# Run the migration
./migrate.sh -u

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "Migration completed successfully"
    # Keep the container running
    echo "Container will stay alive. Press Ctrl+C to stop."
    # Use tail -f /dev/null to keep container running indefinitely
    tail -f /dev/null
else
    echo "Migration failed with exit code $?"
    exit 1
fi