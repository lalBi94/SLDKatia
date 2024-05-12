const express = require("express");
const router = express.Router();

const Database = require("../../models/Database");
const db = new Database();
const db_instance = db.getConnection();

const multer = require("multer");
const upload = multer();

const Reservations = require("../../models/class/Reservations/Reservations");
const reservations_services = new Reservations(db_instance, true);

const Customer = require("../../models/class/Customers/Customers");
const customers_services = new Customer(db_instance);

const { KCDecrypt, KSEncrypt } = require("../../services/KTSec");

const express_rateL = require("express-rate-limit");

const limiter_addingReservation = express_rateL({
    windowMs: 30 * 60 * 1000,
    max: 4,
    message: "Too many request wait 30 minutes.",
});

/**
 * Ajouter une reservation a quelqu'un
 * Endpoint POST /addReservation
 */
router.use("/addReservation", limiter_addingReservation);
router.post("/addReservation", upload.none(), (req, res) => {
    try {
        const { token, items_list } = req.body;

        reservations_services
            .addReservation(token, JSON.parse(items_list))
            .then((d) => {
                res.json(d);
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer la reservation d'un client.
 * Endpoint: POST /getReservationsOf
 */
router.post("/getReservationsOf", (req, res) => {
    try {
        const { data } = req.body;
        const { token, userId } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((d) => {
            if (!d) return null;
            if (d.type !== "admin") return null;
        });

        reservations_services.getReservationsOf(userId).then((data) => {
            res.json(KSEncrypt(JSON.stringify(data)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer les reservations non receptionné de quelqu'un.
 * Endpoint: POST /getActiveReservationsOf
 */
router.post("/getActiveReservationsOf", (req, res) => {
    try {
        const { data } = req.body;

        const { token } = JSON.parse(KCDecrypt(data));

        reservations_services.getActiveReservationsOf(token).then((data) => {
            res.json(KSEncrypt(JSON.stringify(data)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer les reservations receptionné par un client.
 * Endpoint: POST /getConfirmedReservationsOf
 */
router.post("/getConfirmedReservationsOf", (req, res) => {
    try {
        const { data } = req.body;

        const { token } = JSON.parse(KCDecrypt(data));

        reservations_services.getConfirmedReservationsOf(token).then((data) => {
            res.json(KSEncrypt(JSON.stringify(data)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Desactiver une reservation pour la passer au status de receptionné
 * Endpoint: POST /desactivateReservations
 */
router.post("/desactivateReservations", (req, res) => {
    try {
        const { data } = req.body;

        const { token, reservation_id } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((data) => {
            if (!data) return null;
            if (data.type !== "admin") return null;
        });

        reservations_services
            .desactivateReservations(reservation_id)
            .then((data) => {
                res.json(KSEncrypt(JSON.stringify(data)));
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Activer la reservations pour la rendre en non receptionner.
 * Endpoint: POST /activateReservations
 */
router.post("/activateReservations", (req, res) => {
    try {
        const { data } = req.body;

        const { token, reservation_id } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((data) => {
            if (!data) return null;
            if (data.type !== "admin") return null;
        });

        reservations_services
            .activateReservations(reservation_id)
            .then((data) => {
                res.json(KSEncrypt(JSON.stringify(data)));
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer une reservation grace au code de reservation.
 * Endpoint: POST /getRFromCode
 */
router.post("/getRFromCode", (req, res) => {
    try {
        const { data } = req.body;

        const { token, code } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((data) => {
            if (data.type !== "admin") return null;
        });

        reservations_services.getRFromCode(code).then((data) => {
            res.json(KSEncrypt(JSON.stringify(data)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer tous les reservations non receptionné.
 * Endpoint: POST /getActiveReservations
 */
router.post("/getActiveReservations", (req, res) => {
    try {
        const { data } = req.body;

        const { token } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((data) => {
            if (!data) return null;
            if (data.type !== "admin") return null;
        });

        reservations_services.getActiveReservations().then((data) => {
            res.json(KSEncrypt(JSON.stringify(data)));
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer le solde Argent a Venir et Chiffre d'affaire generer par le site.
 * Endpoint: POST /getSolde
 */
router.post("/getSolde", (req, res) => {
    try {
        const { data } = req.body;

        const { token } = JSON.parse(KCDecrypt(data));

        customers_services.decodeToken(token).then((data) => {
            if (!data) return null;
            if (data.type !== "admin") return null;
        });

        reservations_services.getSolde().then((data) => {
            res.json(KSEncrypt(JSON.stringify(data)));
        });
    } catch (err) {
        console.error(err);
    }
});

module.exports = router;
