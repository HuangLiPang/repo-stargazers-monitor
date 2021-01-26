const { addRepo } = require("./controllers/add-repo");
const { listStargazers } = require("./controllers/list-stargazers");

module.exports = (app) => {
    app.get("/add-repo", addRepo);
    app.get("/list-stargazers", listStargazers);
};
