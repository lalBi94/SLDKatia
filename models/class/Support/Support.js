const { MongoClient, ObjectId } = require("mongodb");
const Customer = require("../Customers/Customers");
const moment = require("moment");
const SupportSchema = require("./SupportSchema");

class Support {
    /**
     * @param {MongoClient} link L'objet de connexion vers la BDD
     */
    constructor(link, first = null) {
        this.link = link;

        this.status = {
            succes: 0,
            error: 1,
        };

        this.customer = new Customer(this.link);

        this.database = this.link.db("Support");

        this.collections = {
            list: this.database.collection("list"),
        };

        if (first) {
            console.log(
                "\x1b[30m\x1b[45m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "[OK] ?Support::",
                "\x1b[0m"
            );
        }
    }

    /**
     * Envoyer un message au support du site
     * @param {string?} from Le client / anonyme qui souhaite contacter Katia
     * @param {string} objet Objet ddu message
     * @param {string} content Contenu du message
     * @param {string} contact Contact de la personne pour que Katia la recontacte
     * @return {{status: 0|1}}
     */
    async sendMessage(from, objet, content, contact) {
        try {
            const support_schematic = new SupportSchema(
                from,
                objet,
                content,
                contact
            );

            const final_schematic_o = await support_schematic.getObject();

            const queryAdd = await this.collections.list.insertOne(
                final_schematic_o
            );

            return {
                status: !queryAdd ? this.status.error : this.status.succes,
            };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer tous les messages
     * @return {{status: 0|1, data?: Array<SupportSchema>|[]}}
     */
    async getMessages() {
        try {
            const query = await this.collections.list.find().toArray();

            if (!query) {
                return { status: this.status.error };
            }

            return { status: this.status.succes, data: query };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Supprimer tous les messages
     * @return {{status: 0|1}}
     */
    async deleteAll() {
        try {
            const queryDEL = await this.collections.list.deleteMany();

            if (queryDEL.deletedCount > 0) {
                return { status: this.status.succes };
            } else {
                return { status: this.status.error };
            }
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Supprimer un message donne
     * @return {{status: 0|1}}
     */
    async deleteMessage(id) {
        try {
            const queryDEL = await this.collections.list.deleteOne({
                _id: new ObjectId(id),
            });

            if (queryDEL.deletedCount > 0) {
                return { status: this.status.succes };
            } else {
                return { status: this.status.error };
            }
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }
}

module.exports = Support;
