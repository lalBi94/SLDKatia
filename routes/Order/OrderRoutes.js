const express = require("express");
const router = express.Router();

const Database = require("../../models/Database");
const db = new Database();
const db_instance = db.getConnection();

const multer = require("multer");
const upload = multer();

const Order = require("../../models/class/Orders/Order");
const order_services = new Order(db_instance, true);

const { KCDecrypt, KSEncrypt } = require("../../services/KTSec");

/**
 * Ajouter un produit dans le panier.
 * Endpoint: POST /addToCart
 */
router.post("/addToCart", upload.none(), (req, res) => {
    try {
        const { token, id, qte } = req.body;

        order_services.addToCart(token, id, qte).then((data) => {
            res.json(data);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Retirer un produit du panier.
 * Endpoint: DELETE /removeItem
 */
router.delete("/removeItem", (req, res) => {
    try {
        const { token, id } = req.body;

        order_services.removeItem(token, id).then((data) => {
            res.json(data);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Ajouter un et un seul produit du panier.
 * Endpoint: PUT /plusOne
 */
router.put("/plusOne", (req, res) => {
    try {
        const { token, id } = req.body;

        order_services.plusOne(token, id).then((data) => {
            res.json(data);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Retirer un et un seul produit du panier.
 * Endpoint: PUT /moinsOne
 */
router.put("/moinsOne", (req, res) => {
    try {
        const { token, id } = req.body;

        order_services.moinsOne(token, id).then((data) => {
            res.json(data);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer les produits dans le panier d'un utilisateur. (POST car GET me fait faux bond !)
 * Endpoint: POST /getOrderOf
 */
router.post("/getOrdersOf", upload.none(), (req, res) => {
    try {
        const { token } = req.body;

        order_services.getOrdersOf(token).then((d) => {
            res.json(d);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Vider le panier d'un user.
 * Endpoint: DELETE /removeAllOrdersOf
 */
router.delete("/removeAllOrdersOf", (req, res) => {
    try {
        const { token } = req.body;

        order_services.removeAllOrdersOf(token).then((d) => {
            res.json(d);
        });
    } catch (err) {
        console.error(err);
    }
});

module.exports = router;
