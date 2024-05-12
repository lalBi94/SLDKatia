const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const moment = require("moment");

/**
 * Logique du Backend pour la gestion de la BDD
 * @name Database
 */
class Database {
    constructor() {
        this.link = `${process.env.DB}?retryWrites=true&w=majority`;
        console.log(this.link);

        this.client = new MongoClient(this.link, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
    }

    /**
     * Tester + demarrer la connexion a la BDD.
     * @return {Promise<void>}
     */
    async test() {
        try {
            await this.client.connect();

            await this.client.db("admin").command({ ping: 1 });

            console.log(
                "\x1b[43m\x1b[30m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "[OK] ?Database:: on db.Douze",
                "\x1b[0m"
            );

            return true;
        } catch (err) {
            await this.client.close();

            console.error(
                "\x1b[41m\x1b[30m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "?Database:: failed\n",
                err
            );

            process.exit(1);
        }
    }
    /**
     * Recuperer la connexion a la BDD
     * @return {MongoClient}
     */
    getConnection() {
        return this.client;
    }
}

module.exports = Database;
