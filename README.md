# GitHub Stargazers Monitor

## Description

The repository is the source code of system76 backend assessment. The system leverages [GitHub API](https://docs.github.com/en/rest) to monitor the repositories. It has 2 end points: `add-repo` and `list-stargazer`. Please check the [usage](#endpoint) below. 

Once you use `add-repo` to add the repo to the system. The system will automatically gets the stargazers of the repo. Then you can use `list-stargazers` to check the stargazers.

## Getting Start
Clone this repository:

    git clone https://github.com/HuangLiPang/repo-stargazers-monitor.git

Install requirements

    cd repo-stargazers-monitor
    npm install

Start the server

    npm start


## Endpoint

-   Get `/add-repo`
    -   Add the repository you want to monitor to the system.
    -   Parammeters:
        | Name | Type | Description |
        |-------|--------|-------------------------------|
        | owner | string | Repo's owner (github account) |
        | repo | string | Repo's name |
    -   Code samples
        ```
        curl http://baseurl/add-repo?repo=repo-stargazers-monitor&owner=HuangLiPang
        ```
    -   Response
        - default 
            ```
            Status: 200 OK
            ```
            ```
            {
                "owner": "HuangLiPang",
                "repo": "repo-stargazers-monitor",
                "stargazers_count": 1,
                "message": "add repo succesfully!"
            }
            ```
        - Repo not found
            ```
            Status:400 Bad Request
            ```
            ```
            {
                "error": 400,
                "code": 400,
                "message": "repo not found"
            }
            ```
-   Get `/list-stargazers`
    -   Get the stargazers updated in the range of given date.
    -   Parameters:
        | Name | Type | Description |
        |------------|--------|---------------------------------|
        | owner | string | Repo's owner (github account) |
        | repo | string | Repo's name |
        | start_date | string | UTC time in format `yyyy-mm-dd` |
        | end_date | string | UTC time in format `yyyy-mm-dd` |
    -   Code samples
        ```
        crul https://baseurl/list-stargazers?repo=repo-stargazers-monitor&owner=HuangLiPang&start_time=2021-1-25&end_time=2021-1-25
        ```
    -   Response
        - default 
            ```
            Status: 200 OK
            ```
            ```
            {
                "owner": "HuangLiPang",
                "repo": "repo-stargazers-monitor",
                "stargazers": ["HuangLiPang"],
            }
            ```
        - Repo not exist
            ```
            Status:400 Bad Request
            ```
            ```
            {
                "error": 400,
                "code": 400,
                "message": "repo does not exist in db"
            }
            ```
        ```

## Database

I use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) to store the stargazers. There are 2 types of schema: `repo` and `stargazer` and 3 types of collections: `repo`, `before`, and date `YYYY-MM-DD`. The `repo` collection stores the repo's information. The `before` collection stores the stargazers when the repo is added. The date collection stores the stargazers that star the repo on that date. The `list-stargazers` leverages the `repo_id` in the stargazer schema to find repo belongs to the stargazer.

### Schema
1. Repo schema: 
    Store the added repositories information.
    ```
    {
        owner: String, // github repo's owner
        repo: String, // repo name
        stargazers_count: Number, // number of stargazers
        created_date: String, // the date that the repo is added
    }
        ```
2. Stargazer schema
    ```
    {
        repo_id: ObjectId, // the repo's object id in the repo collection
        username: String, // github username
    }
    ```

## Daily Update

Please check the [daily-update-stargazers.js](./utils/daily-update-stargazers.js) and use test script in the [test directory](./test) to test.

### Implementation
   
The [daily-update-stargazers.js](./utils/daily-update-stargazers.js) will check the `stargazers_count` of the repository in the `repo` collection and compare it with the current stargazers from the [list-stargazers](https://docs.github.com/en/rest/reference/activity#list-stargazers) github api. If the number is different, it will update the newly stargazers.


