const express = require("express");
const router = express.Router();

const Database = require("../../models/Database");
const db = new Database();
const db_instance = db.getConnection();

const multer = require("multer");
const upload = multer();

const Customer = require("../../models/class/Customers/Customers");
const customers_services = new Customer(db_instance);

const Support = require("../../models/class/Support/Support");
const support_services = new Support(db_instance, true);

const { KCDecrypt, KSEncrypt } = require("../../services/KTSec");

const express_rateL = require("express-rate-limit");

const limiter_sendMessage = express_rateL({
    windowMs: 30 * 60 * 1000,
    max: 4,
    message: "Too many request wait 30 minutes.",
});

router.use("/sendMessage", limiter_sendMessage);
router.post("/sendMessage", (req, res) => {
    const { data } = req.body;
    const { from, objet, content, contact } = JSON.parse(KCDecrypt(data));

    support_services.sendMessage(from, objet, content, contact).then((d) => {
        res.json(KSEncrypt(JSON.stringify(d)));
    });
});

router.post("/getMessages", (req, res) => {
    const { data } = req.body;

    const { token } = JSON.parse(KCDecrypt(data));

    customers_services.decodeToken(token).then((a) => {
        if (a.type !== "admin") return null;
    });

    support_services.getMessages().then((d) => {
        res.json(KSEncrypt(JSON.stringify(d)));
    });
});

router.post("/deleteMessage", (req, res) => {
    const { data } = req.body;

    const { token, id } = JSON.parse(KCDecrypt(data));

    customers_services.decodeToken(token).then((a) => {
        if (a.type !== "admin") return null;
    });

    support_services.deleteMessage(id).then((d) => {
        res.json(KSEncrypt(JSON.stringify(d)));
    });
});

router.post("/deleteAll", (req, res) => {
    const { data } = req.body;

    const { token } = JSON.parse(KCDecrypt(data));

    customers_services.decodeToken(token).then((a) => {
        if (a.type !== "admin") return null;
    });

    support_services.deleteAll().then((d) => {
        res.json(KSEncrypt(JSON.stringify(d)));
    });
});

module.exports = router;
