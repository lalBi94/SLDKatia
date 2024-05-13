const express = require("express");
const router = express.Router();
require("dotenv").config();

const { ImgurClient } = require("imgur");
const cl_imgur = new ImgurClient({ clientId: process.env.IMGURL_CLIENT_ID });

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const Database = require("../../models/Database");
const db = new Database();
const db_instance = db.getConnection();

const Customer = require("../../models/class/Customers/Customers");
const customer_services = new Customer(db_instance);

const Items = require("../../models/class/Items/Items");
const items_services = new Items(db_instance, true);

const { KCDecrypt, KSEncrypt } = require("../../services/KTSec");

/**
 * Créer un produit
 * Endpoint: POST /setItem
 */
router.post("/setItem", upload.single("imgRef"), (req, res) => {
    try {
        const { token, name, price, promotion, imgRef, category } = req.body;

        customer_services.decodeToken(token).then((account) => {
            if (!account) return null;
            if (account.type !== "admin") return null;
        });

        cl_imgur
            .upload({
                image: imgRef,
                type: "base64",
                title: `${name}-${price}-${category}`,
            })
            .then((r) => {
                items_services
                    .setItem(
                        name,
                        parseFloat(price),
                        parseInt(promotion),
                        r.data.link,
                        category
                    )
                    .then((status) => {
                        res.json(status);
                    });
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Supprimer un ou plusieurs produits
 * Endpoint: DELETE /deleteItems
 */
router.delete("/deleteItems", (req, res) => {
    try {
        const { token, data } = req.body;

        customer_services.decodeToken(token).then((account) => {
            if (account.type !== "admin") return null;
        });

        items_services.deleteItems(data).then((status) => {
            res.json(status);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer la liste de tous les items.
 * Endpoint: GET /getAllItems
 */
router.get("/getAllItems", (req, res) => {
    try {
        items_services.getAllItems().then((data) => {
            res.json(data);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Modifier les proprietes d'un produit.
 * Endpoint: PUT /modifyItem
 */
router.put("/modifyItem", (req, res) => {
    try {
        const { id, name, price, promotion, imgRef, token } = req.body;

        customer_services.decodeToken(token).then((account) => {
            if (account.type !== "admin") return null;
        });

        items_services
            .modifyItem(
                id,
                name,
                parseFloat(price),
                parseInt(promotion),
                imgRef
            )
            .then((status) => {
                res.json(status);
            });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Recuperer la taille de la liste des items.
 * Endpoint: GET /getItemsLength
 */
router.get("/getItemsLength", (req, res) => {
    try {
        items_services.getItemsLength().then((data) => {
            res.json(data);
        });
    } catch (err) {
        console.error(err);
    }
});

/**
 * Noter un produit
 * Endpoint: POST /note.
 */
router.post("/note", (req, res) => {
    try {
        const { data } = req.body;

        const { token, evaluations } = JSON.parse(KCDecrypt(data));

        items_services.note(token, evaluations).then((d) => {
            res.json(KSEncrypt(d));
        });
    } catch (err) {
        console.error(err);
    }
});

module.exports = router;
