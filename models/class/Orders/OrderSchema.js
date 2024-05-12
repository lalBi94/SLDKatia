/**
 * Format des donnees des commandes
 * @name OrderSchema
 */
class OrderSchema {
    /**
     * @param {string} client_id Identifiant du client
     * @param {string} item_id Item a push dans la BDD
     * @param {?number} qte Quantite
     */
    constructor(client_id, item_id, qte = null) {
        this.client_id = client_id;
        this.item_id = item_id;
        this.qte = qte;

        if (!this.qte) delete this.qte;
    }

    /**
     * L'objet formatter pour etre envoyer a la BDD.
     * @return {Promise<?{client_id: string, item_id: string, qte: ?number}>}
     */
    async getObject() {
        try {
            let to_return = {
                client_id: this.client_id,
                item_id: this.item_id,
            };

            if (this.qte) {
                to_return.qte = this.qte;
            }

            return to_return;
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}

module.exports = OrderSchema;
