const express = require("express");
const router = express.Router();

const Database = require("../../models/Database");
const db = new Database();
const db_instance = db.getConnection();

const Customers = require("../../models/class/Customers/Customers");
const customers_services = new Customers(db_instance, true);

const { KCDecrypt, KSEncrypt } = require("../../services/KTSec");

const express_rateL = require("express-rate-limit");

const limiter_4register = express_rateL({
    windowMs: 30 * 60 * 1000,
    max: 3,
    message: "Too many request wait 30 minutes.",
});

const limiter_4login = express_rateL({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many request wait 15 minutes.",
});

const limiter_4modifying = express_rateL({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many request wait 1 hour.",
});

/**
 * Récupérer la liste de tous les utilisateurs.
 * Endpoint: POST /getAllUsers
 */
router.post("/getAllUsers", (req, res) => {
    try {
        const { data } = req.body;

        const decrypt = JSON.parse(KCDecrypt(data));
        const token = decrypt.token;

        customers_services.decodeToken(token).then((data) => {
            if (data.type !== "admin") return null;
        });

        customers_services.getAllUsers().then((result) => {
            res.json(KSEncrypt(JSON.stringify(result)));
        });
    } catch (err) {
        console.error(err);
    }
});

// TODO: METTRE LES CHECK ADMIN dans un middleware

/**
 * Recuperer les informations d'un utilisateur a partir de son id
 * Endpoint: POST /getInfoBy
 */
router.post("/getInfoBy", (req, res) => {
    try {
        const { data } = req.body;

        const { token, id } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((a) => {
            if (a.type !== "admin") return null;
        });

        customers_services.getInfoBy(id).then((b) => {
            res.json(KSEncrypt(JSON.stringify(b)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Enregistrer un nouvel utilisateur.
 * Endpoint: POST /register
 */
router.use("/register", limiter_4register);
router.post("/register", (req, res) => {
    try {
        const { data } = req.body;

        const decrypt = JSON.parse(KCDecrypt(data));
        const decryptFirstname = decrypt.firstname;
        const decryptLastname = decrypt.lastname;
        const decryptEmail = decrypt.email;
        const decryptPassword = decrypt.password;

        customers_services
            .register(
                decryptFirstname,
                decryptLastname,
                decryptEmail,
                decryptPassword
            )
            .then((result) => {
                res.json(KSEncrypt(JSON.stringify(result)));
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Logger un utilisateur.
 * Endpoint: POST /login
 */
router.use("/login", limiter_4login);
router.post("/login", (req, res) => {
    try {
        const { data } = req.body;

        const decrypt = JSON.parse(KCDecrypt(data));
        console.log(decrypt);
        const decryptEmail = decrypt.email;
        const decryptPassword = decrypt.password;

        customers_services
            .login(decryptEmail, decryptPassword)
            .then((token) => {
                res.json(token ? KSEncrypt(JSON.stringify(token)) : null);
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer les datas du client.
 * Endpoint: POST /getInfo
 */
router.post("/getInfo", (req, res) => {
    try {
        const { data } = req.body;

        const { token } = JSON.parse(KCDecrypt(data));

        customers_services.getInfo(token, false).then((data) => {
            const toSend = data ? KSEncrypt(JSON.stringify(data)) : null;
            res.json(toSend);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Changer le prenom du client.
 * Endpoint: POST /changeFirstname
 */
router.use("/changeFirstname", limiter_4modifying);
router.post("/changeFirstname", (req, res) => {
    try {
        const { data } = req.body;

        const decrypt = JSON.parse(KCDecrypt(data));
        const decryptData = decrypt.firstname;
        const decryptToken = decrypt.token;

        customers_services
            .changeFirstname(decryptData, decryptToken)
            .then((result) => {
                const sCrypt = KSEncrypt(JSON.stringify({ data: result }));
                res.json(sCrypt);
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Changer le NDF du client.
 * Endpoint: POST /changeLastname
 */
router.use("/changeLastname", limiter_4modifying);
router.post("/changeLastname", (req, res) => {
    try {
        const { data } = req.body;

        const decrypt = JSON.parse(KCDecrypt(data));
        const decryptData = decrypt.lastname;
        const decryptToken = decrypt.token;

        customers_services
            .changeLastname(decryptData, decryptToken)
            .then((result) => {
                const sCrypt = KSEncrypt(JSON.stringify({ data: result }));
                res.json(sCrypt);
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Changer l'email du client.
 * Endpoint: POST /changeEmail
 */
router.use("/changeEmail", limiter_4modifying);
router.post("/changeEmail", (req, res) => {
    try {
        const { data } = req.body;

        const decrypt = JSON.parse(KCDecrypt(data));
        const decryptData = decrypt.email;
        const decryptToken = decrypt.token;

        customers_services
            .changeEmail(decryptData, decryptToken)
            .then((result) => {
                const sCrypt = KSEncrypt(JSON.stringify({ data: result }));
                res.json(sCrypt);
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer l'id du client qui enverra son token.
 * Endpoint: POST /getUserId
 */
router.post("/getUserId", (req, res) => {
    try {
        const { data } = req.body;

        const { token } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((data) => {
            res.json(KSEncrypt(JSON.stringify(data ? data._id : null)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Verifier la validité d'un token.
 * Endpoint: POST /verifyTokenValidity
 */
router.post("/verifyTokenValidity", (req, res) => {
    try {
        const { data } = req.body;

        const decrypt = JSON.parse(KCDecrypt(data));
        const decryptToken = decrypt.token;

        customers_services.verifyTokenValidity(decryptToken).then((data) => {
            res.json(KSEncrypt(JSON.stringify(data)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer le nombre de client enregistré du site.
 * Endpoint: POST /getCustomersLength
 */
router.post("/getCustomersLength", (req, res) => {
    try {
        customers_services.getCustomersLength().then((data) => {
            res.json(data);
        });
    } catch (err) {
        console.error(err);
    }
});

module.exports = router;
