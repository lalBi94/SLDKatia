const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const CustomerSchema = require("./CustomerSchema");
require("dotenv").config();
const moment = require("moment");

/**
 * Logique du Backend pour les clients
 * @name Customers
 */
class Customers {
    /**
     * @param {MongoClient} db L'objet de connexion vers la BDD
     */
    constructor(link, first = null) {
        this.link = link;

        this.status = {
            succes: 0,
            error: 1,
            account_already_registered: 2,
        };

        this.database = this.link.db("Customers");

        this.collections = {
            list: this.database.collection("list"),
            history: this.database.collection("history"),
            reservations: this.database.collection("reservations"),
        };

        if (first) {
            console.log(
                "\x1b[30m\x1b[45m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                "[OK] ?Customers::",
                "\x1b[0m"
            );
        }
    }

    /**
     * Generer un token client
     * @param {CustomerSchema} user_data Donnees de l'utilisateur
     * @return {Promise<string>}
     */
    genToken(user_data) {
        return new Promise((resolve, reject) => {
            try {
                const token = jwt.sign(user_data, process.env.JWT_SECRET_KEY, {
                    expiresIn: "24h",
                });
                console.log(
                    "\x1b[30m\x1b[45m",
                    `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                    "[OK] ?Customers:: Token generated",
                    "\x1b[0m"
                );
                resolve(token);
            } catch (err) {
                console.error(
                    "\x1b[41m\x1b[30m",
                    `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                    "[ERR] ?Customers:: Error to generate token",
                    "\x1b[0m"
                );
                console.error(err);
                reject(err);
            }
        });
    }

    /**
     * Decoder un token client
     * @param {string} token Le token client
     * @return {Promise<CustomerSchema>}
     */
    decodeToken(token) {
        return new Promise((resolve, reject) => {
            try {
                const verif = jwt.verify(token, process.env.JWT_SECRET_KEY);

                if (verif) {
                    resolve(jwt.verify(token, process.env.JWT_SECRET_KEY));
                } else {
                    resolve(null);
                }
            } catch (err) {
                resolve(null);
            }
        });
    }

    /**
     * Verifier si le Backend connait le token client
     * @param {string} token Le token client
     * @return {Promise<{status: 0|1}>}
     */
    async verifyTokenValidity(token) {
        try {
            const decode = await this.decodeToken(token);
            return { status: !decode ? this.status.error : this.status.succes };
        } catch (err) {
            return { status: this.status.error };
        }
    }

    /**
     * Retourner tous les utilisateurs
     * @return {Promise<{status: 0|1, data: Array<CustomerSchema>}>}
     */
    async getAllUsers() {
        try {
            const users = (await this.collections.list.find().toArray()).map(
                (e) => {
                    delete e.fidelityPoint;
                    delete e.password;
                    return e;
                }
            );

            return { status: this.status.succes, data: users };
        } catch (err) {
            console.log(
                "\x1b[41m\x1b[30m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                `[ERR] ?Customers:: Failed to retreive all users`,
                "\x1b[0m"
            );
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Inscrire un nouvel utilisateur au site
     * @param {string} firstname Prenom du futur client
     * @param {string} lastname Nom de famille du futur client
     * @param {string} email Email du futur client
     * @param {string} password Mot de passe du futur client
     * @return {Promise<{status: 0|1|2, token: ?string}>}
     */
    async register(firstname, lastname, email, password) {
        try {
            const founded_user = await this.collections.list.findOne({
                email: email,
                password: password,
            });

            if (founded_user)
                return { status: this.status.account_already_registered };

            const schematic = new CustomerSchema(
                firstname,
                lastname,
                email,
                password
            );

            const final_schematic = await schematic.getObject();

            const result = await this.collections.list.insertOne(
                final_schematic
            );

            if (result.insertedId) {
                const user_data = await this.collections.list.findOne({
                    _id: result.insertedId,
                });
                const token = await this.genToken(user_data);

                console.log(
                    "\x1b[30m\x1b[45m",
                    `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                    `[OK] ?Customers:: ${firstname} ${lastname} with ID=${result.insertedId} registered`,
                    "\x1b[0m"
                );
                return { status: this.status.succes, token: token };
            }
        } catch (err) {
            console.error(
                "\x1b[41m\x1b[30m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                `[ERR] ?Customers:: Failed to register ${firstname} ${lastname}`,
                "\x1b[0m"
            );
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Connecter + envoyer un token client au client
     * @param {string} email Email du futur client
     * @param {string} password Mot de passe du futur client
     * @return {Promise<?string>}
     */
    async login(email, password) {
        console.log(
            "\x1b[30m\x1b[45m",
            `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
            `[...] ?Customers:: ${email} try to access...`,
            "\x1b[0m"
        );

        try {
            const flag = await this.collections.list.findOne({
                email: email,
                password: password,
            });

            console.log(flag);
            delete flag.password;

            if (flag) {
                const token = await this.genToken(flag);
                console.log(
                    "\x1b[30m\x1b[45m",
                    `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                    `[OK]Customers:: ${email} successfull login`,
                    "\x1b[0m"
                );
                return token;
            }
        } catch (err) {
            console.error(
                "\x1b[41m\x1b[30m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                `[ERR] ?Customers:: Failed to login ${email}`,
                "\x1b[0m"
            );
            console.error(err);
            return null;
        }
    }

    /**
     * Recuperer les donnees du client a partir d'un token client
     * @param {string} token Le token en question
     * @param {?string} password Livrer le mot de passe ou non ?
     * @return {Promise<{status: 0|1, data: ?CustomerSchema}>}
     */
    async getInfo(token, password = false) {
        try {
            const decoded = await this.decodeToken(token);
            if (!password && decoded) delete decoded.password;

            console.log(decoded);

            if (decoded) {
                console.log(
                    "\x1b[30m\x1b[45m",
                    `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                    `[OK]Customers:: ${token} receive his data`,
                    "\x1b[0m"
                );
                return { status: this.status.succes, data: decoded };
            }
        } catch (err) {
            console.error(
                "\x1b[41m\x1b[30m",
                `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
                `[ERR] ?Customers:: Error when ${token} receive his data`,
                "\x1b[0m"
            );
            console.error(err);
            return { status: this.status.error };
        }
    }

    /**
     * Modifier le prenom d'un client
     * @param {string} firstname Le nouveau prenom
     * @param {string} token Le token du client
     * @return {Promise<{status: 0|1}>}
     */
    async changeFirstname(firstname, token) {
        try {
            const decoded = await this.decodeToken(token);
            const update = { $set: { firstname: firstname } };

            const result = await this.collections.list.updateOne(
                { _id: new ObjectId(decoded._id) },
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
     * Modifier le nom de famille d'un client
     * @param {string} lastname Le nouveau nom de famille
     * @param {string} token Le token du client
     * @return {Promise<{status: 0|1}>}
     */
    async changeLastname(lastname, token) {
        try {
            const decoded = await this.decodeToken(token);
            const update = { $set: { lastname: lastname } };

            const result = await this.collections.list.updateOne(
                { _id: new ObjectId(decoded._id) },
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
     * Modifier l'email' d'un client
     * @param {string} lastname Le nouvel email
     * @param {string} token Le token du client
     * @return {Promise<{status: 0|1|2}>}
     */
    async changeEmail(email, token) {
        try {
            const decoded = await this.decodeToken(token);

            const check = await this.collections.list.findOne({ email: email });

            if (check) {
                return { status: this.status.account_already_registered };
            }

            const update = { $set: { email: email } };

            const result = await this.collections.list.updateOne(
                { _id: new ObjectId(decoded._id) },
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

    async getCustomersLength() {
        try {
            const n = (await this.collections.list.find().toArray()).length;
            return { status: this.status.succes, n: n };
        } catch (err) {
            console.error(err);
            return { status: this.status.error };
        }
    }
}

module.exports = Customers;
