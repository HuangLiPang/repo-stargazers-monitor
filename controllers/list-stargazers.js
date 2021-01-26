const createError = require("http-errors");
const mongoose = require("mongoose");

require("dotenv").config();
const repoCollection = mongoose.model(process.env.REPO_COLLECTION);

async function getCollectionList() {
    let collectionList = await mongoose.connection.db.listCollections().toArray();
    collectionList = collectionList
        .filter(
            (collctionInfo) =>
                collctionInfo.name !== process.env.REPO_COLLECTION &&
                collctionInfo.name !== process.env.BEFORE_COLLECTION
        )
        .map((collctionInfo) => collctionInfo.name);
    return collectionList;
}

async function searchStargzers(repoId, collection) {
    collection = mongoose.model(collection);
    const stargazers = await collection
        .find({
            repo_id: repoId,
        })
        .exec();
    return stargazers.map((element) => element.username);
}

async function searchStargazers(repoId, createdDate, start_time, end_time) {
    const collectionList = await getCollectionList();
    createdDate = new Date(createdDate);
    start_time = new Date(start_time);
    end_time = new Date(end_time);
    let stargazers = [];
    if (start_time <= createdDate) {
        stargazers = stargazers.concat(
            await searchStargzers(repoId, process.env.BEFORE_COLLECTION)
        );
    }
    for (let i = 0; i < collectionList.length; i++) {
        const time = new Date(collectionList[i]);
        if (start_time <= time && time <= end_time) {
            stargazers = stargazers.concat(
                await searchStargzers(repoId, collectionList[i])
            );
        }
    }
    return stargazers;
}

async function listStargazers(req, res, next) {
    const owner = req.query.owner;
    const repo = req.query.repo;
    // check if repo exists
    const repoData = await repoCollection
        .find({
            owner: owner,
            repo: repo,
        })
        .exec();
    if (!repoData.length) {
        next(createError(400, "repo does not exist in db"));
        return;
    }

    const repoId = repoData[0]._id;
    const createdDate = repoData[0].created_date;
    const now = new Date();
    const date = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
    const startTime = req.query.start_time || date;
    const endTime = req.query.end_time || date;
    const stargazers = await searchStargazers(repoId, createdDate, startTime, endTime);
    res.status(200).json({
        owner: owner,
        repo: repo,
        stargazers: stargazers,
    });
}

module.exports = {
    listStargazers: listStargazers,
};
