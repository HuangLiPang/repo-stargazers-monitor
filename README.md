# GitHub Stargazers

## Description

The repository is the source code of system76 backend assessment.

## Endpoint

-   Get `/add-repo`
    -   Params:
        | Name | Type | Description |
        |-------|--------|-------------------------------|
        | owner | string | Repo's owner (github account) |
        | repo | string | Repo's name |
        | | | |
        -   Get `/list-stargazers`
    -   Params:
        | Name | Type | Description |
        |------------|--------|---------------------------------|
        | owner | string | Repo's owner (github account) |
        | repo | string | Repo's name |
        | start_date | string | UTC time in format `yyyy-mm-dd` |
        | end_date | string | UTC time in format `yyyy-mm-dd` |
