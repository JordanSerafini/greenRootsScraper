
interface ProductImage {
    //     product_id INT REFERENCES Product(id),
    url: string;
    alt?: string;
    sizes?: string;
}

interface Category {
    name: string;
    description?: string;
    
}

class Product {
    constructor(
        public name: string,
        public category: Category, // category_id INT REFERENCES Category(id) ON DELETE CASCADE
        public price: number,
        public stock: number,
        public description: string,
        public detailed_description?: string,
        public height?: string,
        public flower_color?: string,
        public flowering_period?: string,
        public watering_frequency?: string,
        public planting_period?: string,
        public exposure?: string,
        public hardiness?: string,
        public planting_distance?: string,
        public images?: ProductImage[],
        public created_at: Date = new Date(),
        public updated_at: Date = new Date()
    ) {}
}