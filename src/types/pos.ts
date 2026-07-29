export interface Category {
  id: string
  name: string
}

export interface ProductUnit {
  id?: string
  product_id?: string
  unit_name: string // e.g. Pcs, Pak, Dus
  conversion_factor: number // e.g. Pcs = 1, Pak = 10, Dus = 40
  price: number // Harga jual untuk unit ini
  is_base_unit: boolean // Apakah ini unit terkecil?
}

export interface Product {
  id: string
  name: string
  barcode: string | null
  category_id: string | null
  stock_in_base_unit: number
  created_at?: string
  product_units?: ProductUnit[]
}