const express = require("express");
const router = express.Router();

const Database = require("../../models/Database");
const db = new Database();
const db_instance = db.getConnection();

const Customer = require("../../models/class/Customers/Customers");
const customers_services = new Customer(db_instance);

const Us = require("../../models/class/Us/Us");
const us_services = new Us(db_instance, true);

const { KCDecrypt, KSEncrypt } = require("../../services/KTSec");

/**
 * Recuperer le numero de telephone
 * Endpoint GET /getTel
 */
router.get("/getTel", (req, res) => {
    try {
        us_services.getTel().then((d) => {
            res.json(d);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer les donnees d'adresse
 * Endpoint GET /getAddress
 */
router.get("/getAddress", (req, res) => {
    try {
        us_services.getAddress().then((d) => {
            res.json(d);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Modifier le numero de telephone
 * Endpoint POST /updateTel
 */
router.post("/updateTel", (req, res) => {
    try {
        const { data } = req.body;
        const { value, token } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((a) => {
            if (!a) return null;
            if (a.type !== "admin") return null;
        });

        us_services.updateTel(value).then((d) => {
            res.json(KSEncrypt(JSON.stringify(d)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Modifier le numero de telephone
 * Endpoint POST /updateAddress
 */
router.post("/updateAddress", (req, res) => {
    try {
        const { data } = req.body;
        const { value, token } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((a) => {
            if (!a) return null;
            if (a.type !== "admin") return null;
        });

        us_services.updateAddress(value).then((d) => {
            res.json(KSEncrypt(JSON.stringify(d)));
        });
    } catch (err) {
        console.error(err);
    }
});

module.exports = router;
