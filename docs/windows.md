## Windows Development Note

When developing on Windows, be aware that Git may automatically convert line endings from LF (Unix-style) to CRLF (Windows-style). This can cause issues with shell scripts run inside Docker containers, such as `entrypoint.sh` and `migrate.sh`, resulting in errors like "entrypoint.sh not found" or "bad interpreter".

To address this, we've added a `.gitattributes` file that forces shell scripts to maintain LF line endings regardless of the operating system.

### For New Repository Clones

The `.gitattributes` file will automatically ensure proper line endings for new files.

### For Existing Repository Clones

If you encounter line ending issues with existing files:

1. Make sure you've pulled the latest changes with the `.gitattributes` file
2. Run: `git add --renormalize .`
3. Commit these changes: `git commit -m "Normalize line endings"`
4. Reset your working directory: `git checkout -- .`

Alternatively, you can also:

- Run `git config --global core.autocrlf input` to configure Git to preserve line endings
- Clone the repository again
