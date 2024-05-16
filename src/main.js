require("dotenv").config();
const moment = require("moment");

console.log(
    `\x1b[30m\x1b[47m/###################################################\\\x1b[0m\n` +
        `\x1b[30m\x1b[47m@                                                   @\x1b[0m\n` +
        `\x1b[30m\x1b[47m@            API des Délices de Katia 1.0           @\x1b[0m\n` +
        `\x1b[30m\x1b[47m@   [Auteurs] Bilal Boudjemline et Ethan Brezeky    @\x1b[0m\n` +
        `\x1b[30m\x1b[47m@   [Contact] bilal.boudjemline@etu.u-pec.fr        @\x1b[0m\n` +
        `\x1b[30m\x1b[47m@   [Organisation] IUT Sénart-Fontainebleau         @\x1b[0m\n` +
        `\x1b[30m\x1b[47m@                                                   @\x1b[0m\n` +
        `\x1b[30m\x1b[47m\\###################################################/\x1b[0m\n\x1b[0m`
);

/**
 * Server
 */
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const corsOption = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200,
};

const app = express();
app.use(bodyParser.json());
app.use(cors(corsOption));
app.use((req, res, next) => {
    console.log("\n↓↓↓↓↓↓↓↓↓", req.ip || req.connection.remoteAddress);
    next();
});

/**
 * Database
 */
const Database = require("../models/Database");
const db_instance = new Database();
db_instance.test();

/**
 * Routes
 */
const item = require("../routes/Item/ItemRoutes");
const order = require("../routes/Order/OrderRoutes");
const customer = require("../routes/Customer/CustomerRoutes");
const reservation = require("../routes/Reservation/ReservationRoutes");
const us = require("../routes/Us/UsRoutes");
const support = require("../routes/Support/SupportRoutes");
app.use("/customer", customer);
app.use("/item", item);
app.use("/order", order);
app.use("/reservation", reservation);
app.use("/us", us);
app.use("/support", support);

app.listen(process.env.PORT, () => {
    console.log(
        "\x1b[30m\x1b[42m",
        `[${moment().format("DD/MM/YY - HH:mm:ss")}]`,
        `[OK] ?Server:: on ${process.env.PORT}`,
        "\x1b[0m"
    );
});
