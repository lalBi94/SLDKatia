/**
 * Format des donnees des messages destine au support en ligne
 * @name SupportSchema
 */
class SupportSchema {
    /**
     * @param {string} from Id du client
     * @param {string} objet Objet du message
     * @param {string} content Contenu du message
     * @param {string} contact Moyen de contacter la personne
     */
    constructor(from, objet, content, contact) {
        this.from = from;
        this.objet = objet;
        this.content = content;
        this.contact = contact;
    }

    /**
     * L'objet formatter pour etre envoyer a la BDD.
     * @return {Promise<{from: string, objet: string, content: string, contact: string}>}
     */
    async getObject() {
        try {
            return {
                from: this.from ? this.from : "Anonyme",
                objet: this.objet,
                content: this.content,
                contact: this.contact,
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}

module.exports = SupportSchema;
