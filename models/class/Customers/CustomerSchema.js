/**
 * Format des donnees du client
 * @name CustomerSchema
 */
class CustomerSchema {
    /**
     * @param {string} firstname Prenom du client
     * @param {string} lastname Nom de famille du client
     * @param {string} email Email du client
     * @param {string} password Mot de passe du client
     */
    constructor(firstname, lastname, email, password) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.password = password;
        this.fidelityPoint = 0.0;
        this.type = "regular";
        this.createdAt = Date.now();
    }

    /**
     * L'objet formatter pour etre envoyer a la BDD.
     * @return {Promise<{firstname: string, lastname: string, email: string, fidelityPoint: string, password: string, type: string, createdAt: Date}|Error>}
     */
    async getObject() {
        return new Promise((resolve, reject) => {
            try {
                resolve({
                    firstname: this.firstname,
                    lastname: this.lastname,
                    email: this.email,
                    fidelityPoint: this.fidelityPoint,
                    password: this.password,
                    type: this.type,
                    createdAt: this.createdAt,
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }
}

module.exports = CustomerSchema;
