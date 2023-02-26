const dbOptions = require("./knexfile");
const knex = require("knex")(dbOptions.production);

module.exports = knex;
