const createError = require("http-errors");
const mongoose = require("mongoose");

require("dotenv").config();
const repoCollection = mongoose.model(process.env.REPO_COLLECTION);

/**
 * Description:
 *      get date collection list of the database
 *
 * @return {string[]} names of collections
 */
async function getCollectionList() {
    // get collection info list in the database
    let collectionList = await mongoose.connection.db.listCollections().toArray();

    // filter out `repo` and `before`
    collectionList = collectionList
        .filter(
            (collctionInfo) =>
                collctionInfo.name !== process.env.REPO_COLLECTION &&
                collctionInfo.name !== process.env.BEFORE_COLLECTION
        ) // we only need collection name
        .map((collctionInfo) => collctionInfo.name);
    return collectionList;
}

/**
 * Description:
 *      search the stargazers from the given collection (`before` collection or
 *      date collections)
 *
 * @param {string} repoId repo id in the repo collection
 * @param {string} collection collection name
 * @return {number} number of stargazers of this repo. if repo does not exist, return -1
 */
async function searchStargazers(repoId, collection) {
    // get collection model
    collection = mongoose.model(collection);
    // get stargazers
    const stargazers = await collection
        .find({
            repo_id: repoId,
        })
        .exec();
    return stargazers.map((element) => element.username);
}

/**
 * Description:
 *      get stargazers from the given range
 *
 * @param {string} repoId repo id in the repo collection
 * @param {string} createdDate the date that the repo added to the system. format: `yyyy-mm-dd`
 * @param {string} startTime the start date of the range to search. format: `yyyy-mm-dd`
 * @param {string} endTime the end date of the range to search. format: `yyyy-mm-dd`
 * @return {number} number of stargazers of this repo. if repo does not exist, return -1
 */
async function getStargazers(repoId, createdDate, startTime, endTime) {
    const collectionList = await getCollectionList();
    createdDate = new Date(createdDate);
    startTime = new Date(startTime);
    endTime = new Date(endTime);
    let stargazers = [];
    if (startTime <= createdDate) {
        stargazers = stargazers.concat(
            await searchStargazers(repoId, process.env.BEFORE_COLLECTION)
        );
    }
    for (let i = 0; i < collectionList.length; i++) {
        const time = new Date(collectionList[i]);
        if (startTime <= time && time <= endTime) {
            stargazers = stargazers.concat(
                await searchStargazers(repoId, collectionList[i])
            );
        }
    }
    return stargazers;
}

/**
 * Description:
 *      middleware for find the list of stargazers from the given date range. If the time
 *      is undefined, default is current date in UTC
 *
 * @typedef {object} showRequestQuery
 * @property {string} owner repo's owner (github username).
 * @property {string} repo repo name
 * @property {string} start_time the start date of the range to search. format: `yyyy-mm-dd`
 * @property {string} end_time the end date of the range to search. format: `yyyy-mm-dd`
 *
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @param {express.NextFunction} next next function
 */
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
    // get the current time
    const now = new Date();
    // transform to UTC date
    const date = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
    // default is current date in UTC
    const startTime = req.query.start_time || date;
    const endTime = req.query.end_time || date;
    // get stargazers
    const stargazers = await getStargazers(repoId, createdDate, startTime, endTime);
    res.status(200).json({
        owner: owner,
        repo: repo,
        stargazers: stargazers,
    });
}

module.exports = {
    listStargazers: listStargazers,
};
