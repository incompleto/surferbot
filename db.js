"use strict";

const Sequelize = require("sequelize");
const { Op } = Sequelize;

module.exports = class Storage {
  constructor() {
    this.sequelize = new Sequelize(
      "database",
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: "0.0.0.0",
        dialect: "sqlite",
        logging: false,
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        },
        storage:
          process.env.ENVIRONMENT === "development"
            ? "./db/development.sqlite3"
            : "./db/production.sqlite3"
      }
    );

    this.sequelize
      .authenticate()
      .then(err => {
        console.log("Connection has been established successfully.");

        this.Link = this.sequelize.define("link", {
          id: {
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            type: Sequelize.INTEGER
          },
          title: {
            type: Sequelize.STRING
          },
          author: {
            type: Sequelize.STRING
          },
          description: {
            type: Sequelize.STRING
          },
          url: {
            type: Sequelize.STRING
          },
          username: {
            type: Sequelize.STRING
          }
        });

        if (process.env.RECREATE) {
          console.log("RECREATING THE DB");
          this.recreateDatabase();
        }
      })
      .catch(function(err) {
        console.log("Unable to connect to the database: ", err);
      });
  }

  recreateDatabase() {
    return this.Link.sync({ force: true });
  }

  createLink({ author, title, description, url, username }) {
    return this.Link.create({ author, title, description, url, username });
  }

  getLinks() {
    return this.Link.findAll({
      order: [["createdAt", "ASC"]]
    });
  }
};
