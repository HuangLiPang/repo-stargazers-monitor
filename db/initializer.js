const mongoose = require("mongoose");
require("dotenv").config();
const MONGODB_URI = process.env.MONGODB_URI;
const REPO_COLLECTION = process.env.REPO_COLLECTION;
const BEFORE_COLLECTION = process.env.BEFORE_COLLECTION;

const { Schema } = mongoose;
const ObjectId = Schema.ObjectId;

const repoSchema = new Schema(
    {
        owner: String,
        repo: String,
        stargazers_count: Number,
        created_date: String,
    },
    {
        collection: REPO_COLLECTION,
    }
);

const stargazerSchema = new Schema({
    repo_id: ObjectId,
    username: String,
});

function initializer() {
    // log query
    mongoose.set("debug", true);
    // connect to mongodb atlas
    mongoose.connect(MONGODB_URI, {
        keepAlive: true,
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });
    // create repo collection
    mongoose.model(REPO_COLLECTION, repoSchema);
    mongoose.model(BEFORE_COLLECTION, stargazerSchema);
}

module.exports = {
    initializer: initializer,
    stargazerSchema: stargazerSchema,
};
