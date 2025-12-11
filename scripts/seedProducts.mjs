import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const CATEGORIES = [
  'Textbooks', 'Electronics', 'Furniture', 'Fashion', 'Appliances', 'Sports', 'Accessories', 'Stationery', 'Others'
]
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor']

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

function titleForCategory(cat) {
  const titles = {
    Textbooks: ['Calculus Made Easy', 'Organic Chemistry Guide', 'Introduction to Algorithms', 'Physics Workbook'],
    Electronics: ['Bluetooth Headphones', 'Gaming Mouse', 'USB-C Hub', 'Portable Speaker'],
    Furniture: ['Study Desk', 'Ergonomic Chair', 'Bookshelf', 'Bedside Table'],
    Fashion: ['Hoodie', 'Sneakers', 'Backpack', 'Winter Jacket'],
    Appliances: ['Microwave Oven', 'Mini Fridge', 'Electric Kettle', 'Blender'],
    Sports: ['Football', 'Tennis Racket', 'Yoga Mat', 'Dumbbell Set'],
    Accessories: ['Phone Case', 'Laptop Sleeve', 'Power Bank', 'Smartwatch Band'],
    Stationery: ['Notebook Pack', 'Fountain Pen', 'Highlighter Set', 'Sticky Notes'],
    Others: ['Mystery Box', 'Assorted Items', 'Bundle Pack', 'Collector Item'],
  }
  const pool = titles[cat] || titles.Others
  return pick(pool)
}

function imageSeeds(n, id) {
  const arr = []
  for (let i = 0; i < n; i++) {
    arr.push(`https://picsum.photos/seed/${id}-${i}/800/600`)
  }
  return arr
}

async function main() {
  console.log('Seeding demo products for all profiles...')
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id,email,name,verified')
    .limit(500)
  if (pErr) {
    console.error('Failed to load profiles:', pErr.message)
    process.exit(1)
  }

  const rows = []
  for (const p of profiles) {
    const count = rand(2, 5)
    for (let i = 0; i < count; i++) {
      const category = pick(CATEGORIES)
      const title = titleForCategory(category)
      const price = rand(2000, 250000)
      const cond = pick(CONDITIONS)
      const idSeed = `${p.id}-${i}-${Date.now()}`
      const images = imageSeeds(rand(1, 4), idSeed)
      const created = new Date(Date.now() - rand(0, 60) * 24 * 60 * 60 * 1000).toISOString()
      rows.push({
        seller_id: p.id,
        title,
        description: `${title} in ${cond.replace('-', ' ')} condition. Owned by ${p.name || p.email}.`,
        price,
        category,
        condition: cond,
        images,
        created_at: created,
      })
    }
  }

  console.log(`Inserting ${rows.length} products...`)
  const { error: insErr } = await supabase.from('products').insert(rows)
  if (insErr) {
    console.error('Insert failed:', insErr.message)
    process.exit(1)
  }
  console.log('Seeding complete.')
}

main()

