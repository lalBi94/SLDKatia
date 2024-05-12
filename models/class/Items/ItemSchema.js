/**
 * Format des donnees des produits
 * @name ItemSchema
 */
class ItemSchema {
    /**
     * @param {string} name Nom du produit
     * @param {number} price Prix du produit
     * @param {number} promotion Promotion du produit
     * @param {string} imgRef Image du produit
     * @param {"Entrée"|"Plat"|"Desert"|"Autre"} category Category du produit
     */
    constructor(name, price, promotion, imgRef, category) {
        this.name = name;
        this.price = price;
        this.promotion = promotion;
        this.rate = [];
        this.imgRef = imgRef;
        this.category = category;
    }

    /**
     * L'objet formatter pour etre envoyer a la BDD.
     * @return {Promise<{name: string, price: number, promotion: number}|Error>}
     */
    async getObject() {
        return new Promise((resolve, reject) => {
            try {
                resolve({
                    name: this.name,
                    price: this.price,
                    promotion: this.promotion,
                    imgRef: this.imgRef,
                    rate: this.rate,
                    category: this.category,
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }
}

module.exports = ItemSchema;
