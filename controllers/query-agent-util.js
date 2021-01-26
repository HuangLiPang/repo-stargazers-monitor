const axios = require("axios");

const queryAgent = axios.create({
    baseURL: "https://api.github.com/",
    timeout: 10000,
    auth: {
        username: "admin",
        password: "password",
    },
    headers: { accept: "application/vnd.github.v3+json" },
});

function query(endPoint, parameters, method) {
    const option = {};
    switch (method) {
        case "get":
            option.params = parameters;
            return queryAgent.get(endPoint, option);
        case "post":
            return queryAgent.post(endPoint, parameters);
        case "put":
            return queryAgent.put(endPoint, parameters);
        case "delete":
            option.data = parameters;
            return queryAgent.delete(endPoint, option);
    }
}

module.exports = {
    query: query,
};
