const mongoose = require("mongoose");
require("dotenv").config();
const MONGODB_URI = process.env.MONGODB_URI;
const REPO_COLLECTION = process.env.REPO_COLLECTION;
const BEFORE_COLLECTION = process.env.BEFORE_COLLECTION;

const { Schema } = mongoose;
const ObjectId = Schema.ObjectId;

// repo schema
// store repo information
const repoSchema = new Schema(
    {
        owner: String, // github repo's owner
        repo: String, // repo name
        stargazers_count: Number, // number of stargazers
        created_date: String, // the date that the repo is added
    },
    {
        collection: REPO_COLLECTION,
    }
);

// stargazer schema
const stargazerSchema = new Schema({
    repo_id: ObjectId, // the repo's object id in the repo collection
    username: String, // github username
});

/**
 * Description:
 *      establish database connection
 *
 */
function initializer() {
    // log query
    mongoose.set("debug", true);
    // connect to mongodb atlas
    mongoose.connect(MONGODB_URI, {
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });
    // create collections
    mongoose.model(REPO_COLLECTION, repoSchema);
    mongoose.model(BEFORE_COLLECTION, stargazerSchema);
}

module.exports = {
    initializer: initializer,
    stargazerSchema: stargazerSchema,
};
