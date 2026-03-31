export async function getProductById(id: string) {
  // 🔥 FUTURE (backend will replace this)
  // const res = await fetch(`/api/products/${id}`)
  // return res.json()

  // ✅ TEMP MOCK (frontend working)
  const mockProducts: any = {
    "1": {
      id: "1",
      name: "Hand-Woven Ceramic Bowl",
      price: 125,
      originalPrice: 150,
      artisanName: "Elena García",
      mainImage:
        "https://images.unsplash.com/photo-1578500494198-246f612d03b3",
      description: "Beautiful handmade ceramic bowl",
      rating: 4.8,
      reviews: 24,
    },
  }

  return mockProducts[id]
}