const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const ItemSchema = require("./ItemSchema");
const moment = require("moment");
const Customers = require("../Customers/Customers");

/**
 * Logique du Backend pour les produits
 * @name Items
 */
class Items {
    /**
     * @param {MongoClient} link L'objet de connexion vers la BDD
     */
    constructor(link, first) {
        this.link = link;

        this.status = {
            succes: 0,
            error: 1,
            items_already_registered: 2,
        };

        this.database = this.link.db("Items");
        this.customer = new Customers(this.link);

        this.collections = {
            list: this.database.collection("list"),
        };

        if (first) {
            console.log(
                "\x1b[30m\x1b[45m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "[OK] ?Items::",
                "\x1b[0m"
            );
        }
    }

    /**
     * Ajouter un produit dans la BDD
     * @param {string} name Nom du produit
     * @param {number} price Prix du produit
     * @param {number} promotion Promotion du produit
     * @param {string} imgRef Image du produit
     * @return {Promise<?{status: 0|1|2}>}
     */
    async setItem(name, price, promotion, imgRef, category) {
        try {
            const founded_item = await this.collections.list.findOne({
                name: name,
                price: price,
                promotion: promotion,
                imgRef: imgRef,
                category: category,
            });

            if (founded_item)
                return { status: this.status.items_already_registered };

            const schematic = new ItemSchema(
                name,
                price,
                promotion,
                imgRef,
                category
            );
            const final_schematic = await schematic.getObject();

            const result = await this.collections.list.insertOne(
                final_schematic
            );

            if (result.insertedId) {
                console.log(
                    `?Item:: Adding ${name} for ${price}E with ID=${result.insertedId} [OK]`
                );
                return { status: this.status.succes };
            }
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer les informations d'un produit
     * @param {string} id Identifiant du produit
     * @return {?ItemSchema}
     */
    async isItemExist(id) {
        try {
            const check = await this.collections.list.findOne({
                _id: new ObjectId(id),
            });
            return check;
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer tous les produits.
     * @return {Promise<?Array<ItemSchema>>}
     */
    async getAllItems() {
        try {
            const items = await this.collections.list.find().toArray();
            return items;
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Effacer plusieurs produit en meme temps
     * @param {Array<string>} items Liste d'identifiant de produits a supprimer
     * @return {Promise<{status: 0|1}>}
     */
    async deleteItems(items) {
        try {
            for (let i = 0; i <= items.length - 1; ++i) {
                await this.collections.list.deleteOne({
                    _id: new ObjectId(items[i]),
                });
            }

            return { status: this.status.succes };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Modifier un produit
     * @param {string} id Identifiant du produit
     * @param {string} name Nom du produit
     * @param {number} price Prix du produit
     * @param {number} promotion Promotion du produit
     * @param {string} imgRef Image du produt
     * @return {Promise<{status: 0|1}>}
     */
    async modifyItem(id, name, price, promotion, imgRef) {
        try {
            const update = {
                $set: {
                    name: name,
                    price: price,
                    promotion: promotion,
                    imgRef: imgRef,
                },
            };

            const result = await this.collections.list.updateOne(
                { _id: new ObjectId(id) },
                update
            );

            if (result.modifiedCount > 0) {
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
     * Recuperer le nombre des produits dans la boutique.
     * @return {Promise<{status: 0|1, n: number?}>}
     */
    async getItemsLength() {
        try {
            const n = (await this.collections.list.find().toArray()).length;
            return { status: this.status.succes, n: n };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer les datas d'un produit.
     * @param {string} id Id de l'item.
     * @return {Promise<{status: 0|1, data: ItemSchema?}>}
     */
    async getItemInfo(id) {
        try {
            const query = await this.collections.list.findOne({
                _id: new ObjectId(id),
            });
            return { status: this.status.succes, data: query };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }
}

module.exports = Items;
