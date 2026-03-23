# ENTS Backend Changelog

All notable changes to this project will be documented in this file.

## Format Template

When adding a new entry, please use the following format:
`- [YYYY-MM-DD] type: Description of the change [#PR_NUMBER](https://github.com/jlab-sensing/ENTS-backend/pull/PR_NUMBER)`

`type` can be one of the following:

- `chore`: Small one off task.
- `fix`: Fixing an created issue.
- `feat`: Adding new features.
- `hotfix`: Fixing urgent breaks of functionality.

---

## Log

- [2026-03-23] fix: increase fallback SECRET_KEY length to resolve PyJWT InsecureKeyLengthWarning [#682](https://github.com/jlab-sensing/ENTS-backend/pull/682)
- [2026-03-12] fix: safely catch PyJWT DecodeErrors and remove log spam for invalid tokens [#683](https://github.com/jlab-sensing/ENTS-backend/pull/683)
- [2026-03-12] hotfix: linted AddCellModal, ensured functionality of D10 charts, and added flags to github action pytest for logging [#703](https://github.com/jlab-sensing/ENTS-backend/pull/703)
- [2026-03-12] hotfix: Resolve global frontend linting failure in AddCellModal [#709](https://github.com/jlab-sensing/ENTS-backend/pull/709)
- [2026-03-10] chore: Enable tests on external PRs [#701](https://github.com/jlab-sensing/ENTS-backend/pull/701)
- [2026-03-10] chore: Setup development server action [#696](https://github.com/jlab-sensing/ENTS-backend/pull/696)
- [2026-03-10] hotfix: Fixed import errors [#698](https://github.com/jlab-sensing/ENTS-backend/pull/698)
- [2026-03-05] chore: remove deprecated import_example_data script and update docs to use ents CLI [#665](https://github.com/jlab-sensing/ENTS-backend/pull/665)
- [2026-03-05] fix: Temp removed "Export to CSV option" hotfix [#671](https://github.com/jlab-sensing/ENTS-backend/pull/671)
