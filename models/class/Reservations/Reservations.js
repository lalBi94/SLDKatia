const { MongoClient, ObjectId } = require("mongodb");
const ReservationSchema = require("./ReservationSchema");
const QRCode = require("qrcode");
const Customer = require("../Customers/Customers");
const Order = require("../Orders/Order");
const Item = require("../Items/Items");
const moment = require("moment");
const ItemSchema = require("../Items/ItemSchema");

/**
 * Logique du Backend pour les reservations
 * @name Reservations
 */
class Reservations {
    /**
     * @param {MongoClient} link L'objet de connexion vers la BDD
     */
    constructor(link, first = null) {
        this.link = link;

        this.status = {
            succes: 0,
            error: 1,
            moreThan2: 2,
            nothing_here: 3,
        };

        this.customer = new Customer(this.link);
        this.order = new Order(this.link);
        this.items = new Item(this.link);

        this.database = this.link.db("Reservations");

        this.collections = {
            list: this.database.collection("list"),
        };

        if (first) {
            console.log(
                "\x1b[30m\x1b[45m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "[OK] ?Reservations::",
                "\x1b[0m"
            );
        }
    }

    /**
     * Generation d'un identifiant de taille n
     * @param {number} n Taille de l'ID
     * @return {number}
     */
    async genId(n) {
        let word = "";

        for (let i = 0; i < n - 3; ++i) {
            word += String.fromCharCode(65 + Math.floor(Math.random() * 25));
        }

        for (let i = 0; i <= n - (n - 2); ++i) {
            word += Math.floor(Math.random() * 10);
        }

        return word;
    }

    /**
     * Ajouter une reservation a un client
     * @param {string} token_c Token du client
     * @param {Array<ItemSchema>} items_list List des produits de la commande
     * @return {Promise<{status: 0|1}>}
     */
    async addReservation(token_c, items_list) {
        try {
            const token = await this.customer.getInfo(token_c);

            if (!token) {
                return { status: this.status.error };
            }

            const reserv_count = (
                await this.collections.list
                    .find({ user_id: token.data._id })
                    .toArray()
            ).reduce((res_n, e) => (e.status ? res_n + 1 : res_n), 0);

            if (reserv_count >= 3) {
                return { status: this.status.moreThan2 };
            }

            let total = 0.0;

            for (let i = 0; i <= items_list.length - 1; ++i) {
                const cur = await this.items.getItemInfo(items_list[i]._id);

                if (cur.status === 1 || !cur.data) {
                    return { status: this.status.error };
                }

                if (cur.data.promotion > 0) {
                    total +=
                        (cur.data.price -
                            (cur.data.price * cur.data.promotion) / 100) *
                        items_list[i].qte;
                } else {
                    total += cur.data.price * items_list[i].qte;
                }
            }

            total = parseFloat(total.toFixed(2));

            const text = await this.genId(6);
            const qr = await QRCode.toDataURL(text);
            const reservation_schematic = new ReservationSchema(
                token.data._id.toString(),
                items_list,
                qr,
                text,
                total,
                true
            );
            const final_schematic_o = await reservation_schematic.getObject();

            const queryAdd = await this.collections.list.insertOne(
                final_schematic_o
            );

            if (!queryAdd) {
                return { status: this.status.error };
            }

            const queryDEL = await this.order.clearCart(token_c);

            if (queryDEL.status === 1) {
                return { status: this.status.error };
            }

            console.log(
                `?Reservation:: new one with ID=${
                    queryAdd.insertedId
                } for ${token.data._id.toString()} [OK]`
            );

            return {
                status: this.status.succes,
                codeqr: qr,
                codetxt: text,
                total: total,
            };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer la reservation d'un client.
     * @param {string} user_id Id du client.
     * @return {Promise<{status: 0|1, data: ReservationSchema?}>}
     */
    async getReservationsOf(user_id) {
        try {
            const reservations = await this.collections.list
                .find({ user_id: user_id })
                .toArray();
            return { status: this.status.succes, data: reservations };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Desactiver une reservation (la confirmer)
     * @param {string} reservation_id Id de la reservation.
     * @return {Promise<{status: 0|1}>}
     */
    async desactivateReservations(reservation_id) {
        try {
            const update = {
                $set: {
                    status: false,
                },
            };
            const query = await this.collections.list.updateOne(
                { _id: new ObjectId(reservation_id) },
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
     * Activer une reservation (la déconfirmer ? pour du support etc...)
     * @param {string} reservation_id Id de la reservation
     * @return {Promise<{status:0|1}>}
     */
    async activateReservations(reservation_id) {
        try {
            const update = {
                $set: {
                    status: true,
                },
            };
            const query = await this.collections.list.updateOne(
                { _id: new ObjectId(reservation_id) },
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
     * Recuperer une reservation via le code de reservation.
     * @param {string} code Le code de reservation.
     * @return {Promise<{status: 0|1, info: ReservationSchema?}>}
     */
    async getRFromCode(code) {
        try {
            const query = await this.collections.list.findOne({ qrtxt: code });
            return { status: this.status.succes, info: query };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer le montant prevu (en attente de reception) et l'argent confirmé (deja receptionné sur le stand).
     * @return {Promise<{status: 0|1, av: float?, ca: float?}>}
     */
    async getSolde() {
        try {
            const query = await this.collections.list.find().toArray();
            let CA = 0;
            let AV = 0;

            for (let i = 0; i <= query.length - 1; ++i) {
                const curTotal = parseFloat(query[i].total);

                switch (query[i].status) {
                    case false: {
                        CA += curTotal;
                        break;
                    }

                    case true: {
                        AV += curTotal;
                        break;
                    }
                }
            }

            return { status: this.status.succes, av: AV, ca: CA };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer tous les reservations non receptionné.
     * @return {Promise<{status: 0|1, data: Array<ReservationSchema>?}>}
     */
    async getActiveReservations() {
        try {
            const query = await this.collections.list
                .find({ status: true })
                .toArray();
            return { status: this.status.succes, data: query };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer les reservations non receptionné d'un client
     * @param {string} token Le token du client.
     * @return {Promise<{status: 0|1|3, data: Array<ReservationSchema>?}>}
     */
    async getActiveReservationsOf(token) {
        try {
            const token_c = await this.customer.decodeToken(token);
            if (!token_c) {
                return { status: this.status.error };
            }

            const query = await this.collections.list
                .find({ status: true, user_id: token_c._id })
                .toArray();
            if (query.length > 0) {
                return { status: this.status.succes, data: query };
            } else if (query.length === 0) {
                return { status: this.status.nothing_here };
            } else {
                return { status: this.status.error };
            }
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Recuperer les reservations receptionné par un client.
     * @param {string} token Le token du client.
     * @return {Promise<{status: 0|1|3, data: Array<ReservationSchema>}>}
     */
    async getConfirmedReservationsOf(token) {
        try {
            const token_c = await this.customer.decodeToken(token);
            if (!token_c) {
                return { status: this.status.error };
            }

            const query = await this.collections.list
                .find({ status: false, user_id: token_c._id })
                .toArray();
            if (query.length > 0) {
                return { status: this.status.succes, data: query };
            } else if (query.length === 0) {
                return { status: this.status.nothing_here };
            } else {
                return { status: this.status.error };
            }
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }
}

module.exports = Reservations;
