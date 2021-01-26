const githubQueryHelper = require("./query-agent-util");
const createError = require("http-errors");
const mongoose = require("mongoose");

require("dotenv").config();
const repoCollection = mongoose.model(process.env.REPO_COLLECTION);
const beforeCollection = mongoose.model(process.env.BEFORE_COLLECTION);

async function getStargazersCount(owner, repo) {
    const endpoint = `repos/${owner}/${repo}`;
    let result = null;
    try {
        result = await githubQueryHelper.query(endpoint, {}, "get");
    } catch (err) {
        return -1;
    }
    return result.data.stargazers_count;
}

async function getStargazersList(owner, repo, page) {
    // in order to reduce query time to github api
    // the number of stargazers is set to max (100) per page
    const endpoint = `repos/${owner}/${repo}/stargazers`;
    const result = await githubQueryHelper.query(
        endpoint,
        {
            owner: owner,
            repo: repo,
            per_page: 100,
            page: page,
        },
        "get"
    );
    return result.data;
}

async function ingestStargazers(owner, repo, repoId) {
    // get stargzers count
    const stargazersCount = await getStargazersCount(owner, repo);
    // repo not found
    if (stargazersCount === -1) return stargazersCount;
    const stargazersPage = parseInt(stargazersCount / 100) + 1;
    for (let i = 1; i <= stargazersPage; i++) {
        // get stargazer list
        const stargazersList = await getStargazersList(owner, repo, i);
        stargazersList.forEach((item, index, thisList) => {
            thisList[index] = {
                repo_id: mongoose.Types.ObjectId(repoId),
                username: item["login"],
            };
        });
        // insert to db
        beforeCollection.insertMany(stargazersList);
    }
    return stargazersCount;
}

async function addRepo(req, res, next) {
    const owner = req.query.owner;
    const repo = req.query.repo;

    // check if repo exists in db
    const repoData = await repoCollection
        .find({
            owner: owner,
            repo: repo,
        })
        .exec();
    if (repoData.length) {
        next(createError(400, "repo already existed"));
        return;
    }

    // create a repo document to get object id
    const now = new Date();
    let result = await repoCollection.bulkWrite([
        {
            insertOne: {
                document: {
                    owner: owner,
                    repo: repo,
                    stargazers_count: 0,
                    created_date: `${now.getUTCFullYear()}-${
                        now.getUTCMonth() + 1
                    }-${now.getUTCDate()}`,
                },
            },
        },
    ]);
    const repoId = result.insertedIds[0];
    // ingest stargazers to db
    const stargazersCount = await ingestStargazers(owner, repo, repoId);
    if (stargazersCount === -1) {
        // repo does not exist in github
        // delete the document in db
        await repoCollection.bulkWrite([
            {
                deleteOne: {
                    filter: {
                        owner: owner,
                        repo: repo,
                    },
                },
            },
        ]);
        next(createError(400, "repo not found"));
    } else {
        // update stargazers
        await repoCollection.bulkWrite([
            {
                updateOne: {
                    filter: {
                        owner: owner,
                        repo: repo,
                    },
                    update: {
                        stargazers_count: stargazersCount,
                    },
                },
            },
        ]);
        res.status(201).json({
            owner: owner,
            repo: repo,
            stargazers_count: stargazersCount,
            message: "add repo succesfully!",
        });
    }
    return;
}

module.exports = {
    addRepo: addRepo,
    getStargazersCount: getStargazersCount,
    getStargazersList: getStargazersList,
};
