const { updateStargazers } = require("../utils/update-daily-stargazers");

updateStargazers("HuangLiPang", "pm2.5-idw-map", "600f92a0c9be2c5366fa5b87").then(() =>
    process.exit()
);
