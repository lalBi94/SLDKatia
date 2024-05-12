const UsSchema = "./UsSchema.js";
const moment = require("moment");
const { MongoClient, ObjectId } = require("mongodb");

class Us {
    /**
     * @param {MongoClient} link L'objet de connexion vers la BDD
     */
    constructor(link, first = null) {
        this.link = link;
        this.database = this.link.db("Us");
        this.collections = {
            list: this.database.collection("list"),
        };

        this.status = {
            succes: 0,
            error: 1,
            nothing: 2,
        };

        if (first) {
            console.log(
                "\x1b[30m\x1b[45m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "[OK] ?Us::",
                "\x1b[0m"
            );
        }
    }

    /**
     * Recuperer le numero de telephone
     * @return {Promise<{status: 0|1|2, tel?: string}>}
     */
    async getTel() {
        try {
            const tel = await this.collections.list.findOne({ name: "tel" });

            return {
                status: tel._id ? this.status.succes : this.status.nothing,
                tel: tel.value,
            };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Update le numero de telephone
     * @param {string} value Numero de tel
     * @return {Promise<{status: 0|1}>}
     */
    async updateTel(value) {
        try {
            const update = {
                $set: {
                    value,
                },
            };

            const query = await this.collections.list.updateOne(
                { name: "tel" },
                update
            );

            if (query.matchedCount > 0) {
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
     * Update l'adresse
     * @param {{value: string, linktomap: string}} value Nouvelle adresse + lien menant a l'adresse sur une map
     * @return {Promise<{status: 0|1}>}
     */
    async updateAddress(value) {
        try {
            const update = {
                $set: {
                    value: value.value,
                    linktomap: value.linktomap,
                },
            };

            const query = await this.collections.list.updateOne(
                { name: "address" },
                update
            );

            if (query.matchedCount > 0) {
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
     * Recuperer l'adresse
     * @return {Promise<{status: 0|1|2, value?: string, linktomap?: string }>}
     */
    async getAddress() {
        try {
            const address = await this.collections.list.findOne({
                name: "address",
            });

            return {
                status: address._id ? this.status.succes : this.status.nothing,
                value: address.value,
                linktomap: address.linktomap,
            };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }
}

module.exports = Us;
