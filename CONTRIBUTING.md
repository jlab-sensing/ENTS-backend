# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue or any other method with the owners of this repository before making a change.

## Code Contributions

### Your first issue

1. Read the project's README.md to learn how to setup the development environment.
2. Find an issue to work on. The best way is to look for the good first issue or help wanted labels
3. Comment on the issue saying you are going to work on it.
4. Code! Make sure to update unit tests!
5. When done, create your pull request.
6. Verify that CI passes all status checks, or fix if needed.
7. Wait for other developers to review your code and update code as needed.
8. Once reviewed and approved, a DirtViz developer will merge your pull request.

### Pull Request Process

1. Verify that CI passes all status checks, or fix if needed.
2. Update the pull request with details of changes to the interface, this includes new environment
    variables, exposed ports, useful file locations and container parameters.
3. Wait for other developers to review your code and update code as needed.
4. Once reviewed and approved, a DirtViz developer will merge your pull request.

## Code formatting

DirtViz uses various formmaters and linters to maintain a standard of code.

### Formmater

#### Black

For Python files, DirtViz uses Black to format files to keep coding styles consistent throughout the code base.

To install run:

```bash
pip install black
```

#### Prettier

For JSX files, DirtViz uses Prettier to format files to keep coding styles consistent throughout the code base.

To install Prettier, search up Prettier in VSCode extension marketplace and install it.

### Linting

#### Ruff

For Python files, DirtViz uses Ruff to lint for potential syntax/code errors.
Run ruff with the following commmand:

```bash
ruff check .
```

#### ESLint

For JSX files, DirtViz uses ESLint to lint for potential syntax/code errors.
Run ESLint with the following commmand while in the frontend folder:

```bash
npm run lint
```

## Attribution

Portions adopted from <https://github.com/rapidsai/cuml/blob/branch-24.04/CONTRIBUTING.md>
