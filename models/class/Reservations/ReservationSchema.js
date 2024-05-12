/**
 * Format des donnees des reservations
 * @name ReservationSchema
 */
class ReservationSchema {
    /**
     * @param {string} user_id Id du client
     * @param {Base64} qrcode Image du qr code
     * @param {Array<ItemSchema>} items_list List des produits
     * @param {string} qrtxt Code de la reservation
     * @param {number} total Le total de la commande
     * @param {boolean} status Activé / Desactivé
     */
    constructor(user_id, items_list, qrcode, qrtxt, total, status) {
        this.user_id = user_id;
        this.items_list = items_list;
        this.qrcode = qrcode;
        this.qrtxt = qrtxt;
        this.total = total;
        this.status = status;
    }

    /**
     * L'objet formatter pour etre envoyer a la BDD.
     * @return {Promise<{items_list: Array<ItemSchema>, qrcode: Base64[], qrtxt: string, total: number, status: boolean}>}
     */
    async getObject() {
        try {
            return {
                user_id: this.user_id,
                items_list: this.items_list,
                qrcode: this.qrcode,
                qrtxt: this.qrtxt,
                total: this.total,
                status: this.status,
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}

module.exports = ReservationSchema;
