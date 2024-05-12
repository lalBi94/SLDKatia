const OrderSchema = require("./OrderSchema");
const { MongoClient } = require("mongodb");
const Customer = require("../Customers/Customers");
const Items = require("../Items/Items");
const moment = require("moment");
const cron = require("node-cron");

/**
 * Logique du Backend pour les commandes
 * @name Order
 */
class Order {
    /**
     * @param {MongoClient} link L'objet de connexion vers la BDD
     */
    constructor(link, first = null) {
        this.link = link;

        this.customer = new Customer(this.link);
        this.item = new Items(this.link);

        this.status = {
            succes: 0,
            error: 1,
        };

        this.database = this.link.db("Order");

        this.collection = {
            list: this.database.collection("list"),
        };

        if (first) {
            /**
             * Supprimer tous les paniers toutes les 3h si un ou n elements est present
             */
            cron.schedule("0 */3 * * *", () => {
                try {
                    this.collection.list.estimatedDocumentCount().then((n) => {
                        if (n > 0) {
                            this.collection.list.deleteMany({}).then((res) => {
                                console.log(
                                    "\x1b[30m\x1b[45m",
                                    `[${moment().format(
                                        "DD/MM/YY - HH:mm:ss"
                                    )}]`,
                                    `[OK] ?Orders:: x${n} cleared`,
                                    "\x1b[0m"
                                );
                            });
                        } else {
                            console.log(
                                "\x1b[30m\x1b[45m",
                                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                                "[OK] ?Orders:: No one orders to clear",
                                "\x1b[0m"
                            );
                        }
                    });
                } catch (err) {
                    console.error();
                }
            });

            console.log(
                "\x1b[30m\x1b[45m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "[OK] ?Orders::",
                "\x1b[0m"
            );
        }
    }

    /**
     * Efface de la commande un produit donnee
     * @param {string} token_c Token du client
     * @param {string} itemId Identifiant du produit
     * @return {Promise<{status: 0|1}>}
     */
    async removeItem(token_c, itemId) {
        try {
            const token = await this.customer.getInfo(token_c);
            const checkItem = await this.item.isItemExist(itemId);

            if (!token || !checkItem) {
                return { status: this.status.error };
            }

            const result = await this.collection.list.deleteOne({
                client_id: token.data._id.toString(),
                item_id: itemId,
            });

            if (result.deletedCount > 0) {
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
     * Recuperer la commande un produit donnee
     * @param {string} token_c Token du client
     * @return {Promise<{status: 0|1, data: OrderSchema}>}
     */
    async getOrdersOf(token_c) {
        try {
            const token = await this.customer.getInfo(token_c);
            if (!token) {
                return { status: this.status.error };
            }

            const orders_list = await this.collection.list
                .find({ client_id: token.data._id })
                .toArray();

            let data = [];

            for (let i = 0; i <= orders_list.length - 1; ++i) {
                const item = await this.item.isItemExist(
                    orders_list[i].item_id
                );

                if (item) {
                    item.qte = orders_list[i].qte;
                    data.push(item);
                } else {
                    await this.removeItem(token_c, orders_list[i].item_id);
                }
            }

            return { status: this.status.succes, data: data };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Supprimer le panier entier de l'utilisateur
     * @param {string} token Le token du client
     */
    async removeAllOrdersOf(token) {
        const token_c = await this.customer.getInfo(token);

        if (!token_c) {
            return { status: this.status.error };
        }

        const query = await this.collection.list.deleteMany({
            client_id: token_c.data._id,
        });

        if (query.deletedCount > 0) {
            return { status: this.status.succes };
        } else {
            console.error("pas ok");
            return { status: this.status.error };
        }
    }

    /**
     * DUPLICATION juste pour un signe oui
     * Faire +1 sur un produit de la commande
     * @param {string} token_c Token du client
     * @param {string} itemId Identifiant du produit
     * @return {Promise<{status: 0|1}>}
     */
    async plusOne(token_c, itemId) {
        try {
            const token = await this.customer.getInfo(token_c);
            const checkItem = this.item.isItemExist(itemId);

            if (!token || !checkItem) {
                return { status: this.status.error };
            }

            const result = await this.collection.list.findOne({
                client_id: token.data._id.toString(),
                item_id: itemId,
            });

            if (!result) {
                console.log(result);
                return { status: this.status.error };
            }

            const schematic_o = new OrderSchema(
                token.data._id,
                itemId,
                result.qte
            );
            const final_schematic_o = await schematic_o.getObject();

            const update = {
                $set: {
                    qte: final_schematic_o.qte + 1,
                },
            };

            const query = await this.collection.list.updateOne(
                final_schematic_o,
                update
            );

            if (query.modifiedCount > 0) {
                return { status: this.status.succes };
            } else {
                console.log("mod");
                return { status: this.status.error };
            }
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * DUPLICATION juste pour un signe oui
     * Faire +1 sur un produit de la commande
     * @param {string} token_c Token du client
     * @param {string} itemId Identifiant du produit
     * @return {Promise<{status: 0|1}>}
     */
    async moinsOne(token_c, itemId) {
        try {
            const token = await this.customer.getInfo(token_c);
            const checkItem = this.item.isItemExist(itemId);

            if (!token || !checkItem) {
                return { status: this.status.error };
            }

            const result = await this.collection.list.findOne({
                client_id: token.data._id.toString(),
                item_id: itemId,
            });

            if (!result) {
                return { status: this.status.error };
            }

            const schematic_o = new OrderSchema(
                token.data._id,
                itemId,
                result.qte
            );
            const final_schematic_o = await schematic_o.getObject();

            const update = {
                $set: {
                    qte: final_schematic_o.qte - 1,
                },
            };

            const query = await this.collection.list.updateOne(
                final_schematic_o,
                update
            );

            if (query.modifiedCount > 0) {
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
     * Vider le panier
     * @param {string} token_c Token du client
     * @return {Promise<{status: 0|1}>}
     */
    async clearCart(token_c) {
        try {
            const token = await this.customer.getInfo(token_c);

            if (!token) {
                return { status: this.status.error };
            }

            const queryDEL = await this.collection.list.deleteMany({
                client_id: token.data._id.toString(),
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

    /**
     * Ajouter au panier un produit
     * @param {string} token_c Token du client
     * @param {string} itemId Identifiant du produit
     * @param {number} qte Quantite
     * @return {Promise<{status: 0|1}>}
     */
    async addToCart(token_c, itemId, qte) {
        try {
            const token = await this.customer.getInfo(token_c);
            const checkItem = await this.item.isItemExist(itemId);

            if (!token || !checkItem) {
                return { status: this.status.error };
            }

            const schematic_o = new OrderSchema(token.data._id, itemId, qte);
            const final_schematic_o = await schematic_o.getObject();

            delete final_schematic_o.qte;

            const checkIfExist = await this.collection.list.findOne(
                final_schematic_o
            );

            if (checkIfExist) {
                const new_schematic_o = new OrderSchema(
                    token.data._id,
                    itemId,
                    checkIfExist.qte + 1
                );

                const new_final_schematic_o = await new_schematic_o.getObject();

                const update = {
                    $set: new_final_schematic_o,
                };

                await this.collection.list.updateOne(
                    {
                        item_id: itemId,
                        client_id: token.data._id,
                    },
                    update
                );
            } else {
                final_schematic_o.qte = 1;
                await this.collection.list.insertOne(final_schematic_o);
            }

            return { status: this.status.succes };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    // /**
    //  * Recuperer la taille du panier.
    //  * @param {string} token Le token du client.
    //  * @return {Promise<{status: 0|1, count: number?}>}
    //  */
    // async getCartLength(token) {
    //     try {
    //         const token_c = await this.customer.decodeToken(token);

    //         if (!token_c) {
    //             return { status: this.status.error };
    //         }

    //         const query = await this.collection.list
    //             .find({ client_id: token_c._id })
    //             .toArray();
    //         return { status: this.status.succes, count: query.length };
    //     } catch (err) {
    //         console.error(err);
    //         return { status: this.status.error };
    //     }
    // }
}

module.exports = Order;
