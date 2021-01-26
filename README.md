# GitHub Stargazers Monitor

## Description

The repository is the source code of system76 backend assessment. The system leverages [GitHub API](https://docs.github.com/en/rest) to monitor the repositories. It has 2 end points: `add-repo` and `list-stargazer`. Please check the [usage](#endpoint) below. 

Once you use `add-repo` to add the repo to the system. The system will automatically gets the stargazers of the repo. Then you can use `list-stargazers` to check the stargazers.

## Getting Start
Clone this repository:

```bash
git clone https://github.com/HuangLiPang/repo-stargazers-monitor.git
```
    
Install requirements
    
```bash
cd repo-stargazers-monitor
npm install
```

Create a `.env` file contains `PORT`, `MONGODB_URI`, `REPO_COLLECTION`, `BEFORE_COLLECTION`, and `NODE_ENV`. Pleasse check the example below.

```text
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@example.mongodb.com/<dbname>?retryWrites=true&w=majority
REPO_COLLECTION=repo
BEFORE_COLLECTION=before
NODE_ENV=production
```

Start the server

```bash
npm start
```
    
## Try Demo
The system is deployed on [Heroku](https://www.heroku.com/home). Please try this url [https://repo-stargazers-monitor.huanglipang.me](https://repo-stargazers-monitor.huanglipang.me) with the end point `add-repo` and `list-stargazers`.

## Endpoint

-   Get `/add-repo`
    -   Add the repository you want to monitor to the system.
    -   Parammeters:
        | Name | Type | Description |
        |-------|--------|-------------------------------|
        | owner | string | Repo's owner (github account) |
        | repo | string | Repo's name |
    -   Code samples
        ```bash
        curl https://repo-stargazers-monitor.huanglipang.me/add-repo?repo=repo-stargazers-monitor&owner=HuangLiPang
        ```
    -   Response
        - default 
            ```
            Status: 200 OK
            ```
            ```json
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
            ```json
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
        ```bash
        crul https://repo-stargazers-monitor.huanglipang.me/list-stargazers?repo=repo-stargazers-monitor&owner=HuangLiPang&start_time=2021-1-25&end_time=2021-1-25
        ```
    -   Response
        - default 
            ```
            Status: 200 OK
            ```
            ```json
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
            ```json
            {
                "error": 400,
                "code": 400,
                "message": "repo does not exist in db"
            }
            ```

## Database

I use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) to store the stargazers. There are 2 types of schema: `repo` and `stargazer` and 3 types of collections: `repo`, `before`, and date `YYYY-MM-DD`. The `repo` collection stores the repo's information. The `before` collection stores the stargazers when the repo is added. The date collection stores the stargazers that star the repo on that date. The `list-stargazers` leverages the `repo_id` in the stargazer schema to find repo belongs to the stargazer.

### Schema
1. Repo schema: 
    Store the added repositories information.
    ```javascript
    {
        owner: String, // github repo's owner
        repo: String, // repo name
        stargazers_count: Number, // number of stargazers
        created_date: String, // the date that the repo is added
    }
    ```
2. Stargazer schema
    ```javascript
    {
        repo_id: ObjectId, // the repo's object id in the repo collection
        username: String, // github username
    }
    ```
## Daily Update

Please check the [daily-update-stargazers.js](./utils/daily-update-stargazers.js) and use test script in the [test directory](./test) to test.

### Implementation
   
The [daily-update-stargazers.js](./utils/daily-update-stargazers.js) will check the `stargazers_count` of the repository in the `repo` collection and compare it with the current stargazers from the [list-stargazers](https://docs.github.com/en/rest/reference/activity#list-stargazers) github api. If the number is different, it will update the newly stargazers.

I can use [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) addon to update the stargazers in the mid night in UTC time with following steps:
1. Get the list of repository in the `repo` collection.
2. Use [daily-update-stargazers.js](./utils/daily-update-stargazers.js) to update the stargazers.

## To Do
1. Compare the stargazers that cancel their stars
2. Daily update script

## Reference
1. [GitHub API](https://docs.github.com/en/rest)
2. [list-stargazers](https://docs.github.com/en/rest/reference/activity#list-stargazers)
3. [get-a-repository](https://docs.github.com/en/rest/reference/repos#get-a-repository)
