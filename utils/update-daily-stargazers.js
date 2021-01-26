const { stargazerSchema, initializer } = require("../db/initializer");

// initialize db connection
initializer();
const { getStargazersCount, getStargazersList } = require("../controllers/add-repo");
const mongoose = require("mongoose");

require("dotenv").config();
const REPO_COLLECTION = process.env.REPO_COLLECTION;
const repoCollection = mongoose.model(REPO_COLLECTION);

/**
 * Description:
 *      Get collection from the mongodb.
 *
 * @param {string} name collection name
 * @return {model} mongoose model instance of the collection
 */
function getCollection(name) {
    mongoose.model(name, stargazerSchema);
    return mongoose.model(name);
}

/**
 * Description:
 *      Update number of stargazers in the repo collection
 *
 * @param {string} repoId repo id in the repo collection
 * @param {number} stargazersCount number of stargazers
 */
async function updateStargazersCount(repoId, stargazersCount) {
    await repoCollection.bulkWrite([
        {
            updateOne: {
                filter: {
                    _id: repoId,
                },
                update: {
                    stargazers_count: stargazersCount,
                },
            },
        },
    ]);
}

/**
 * Description:
 *      Update stargazers to the daily collection
 *
 * @param {string} owner repo's owner (github username).
 * @param {string} repo repo name
 * @param {string} repoId repo id in the repo collection
 */
async function updateStargazers(owner, repo, repoId) {
    // get new stargzers count
    const newStargazersCount = await getStargazersCount(owner, repo);
    if (newStargazersCount === -1) return newStargazersCount;
    const newStargazersPage = parseInt(newStargazersCount / 100) + 1;
    const repoData = await repoCollection
        .find({
            owner: owner,
            repo: repo,
        })
        .exec();

    const oldStargazersCount = repoData[0].stargazers_count;
    let oldStargazersPage = 0;

    // get collections
    const now = new Date();
    const date = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
    const collection = getCollection(date);

    // in order to reduce query stargazer times
    // the number of stargazer per query is set to 100 per page
    // if the old stargazers number == 0
    if (oldStargazersCount !== 0) {
        // if the old stargazers number % 0 == 0
        if (oldStargazersCount % 100 !== 0) {
            const startIndex = oldStargazersCount % 100;
            oldStargazersPage = parseInt(oldStargazersCount / 100) + 1;
            // store first fractional page
            let stargazersList = await getStargazersList(owner, repo, oldStargazersPage);
            stargazersList = stargazersList
                .filter((item, index) => index >= startIndex)
                .map((item) => {
                    return {
                        repo_id: mongoose.Types.ObjectId(repoId),
                        username: item["login"],
                    };
                });
            await collection.insertMany(stargazersList);
        } else {
            oldStargazersPage = parseInt(oldStargazersCount / 100);
        }
    }

    // insert new stargazers
    for (let i = oldStargazersPage + 1; i <= newStargazersPage; i++) {
        const stargazersList = await getStargazersList(owner, repo, oldStargazersPage);
        stargazersList.forEach((item, index, thisList) => {
            thisList[index] = {
                repo_id: mongoose.Types.ObjectId(repoId),
                username: item["login"],
            };
        });
        await collection.insertMany(stargazersList);
    }
    // update new stargazers number
    await updateStargazersCount(mongoose.Types.ObjectId(repoId), newStargazersCount);
    console.log(`Original number of stargazers of ${repo} is ${oldStargazersCount}`);
    console.log(`Latest number is ${newStargazersCount}`);
    return;
}

module.exports = {
    updateStargazers: updateStargazers,
};
