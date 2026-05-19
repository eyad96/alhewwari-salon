import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const host = 'aws-0-ap-northeast-1.pooler.supabase.com';
const user = 'postgres.gawzuxjwqbtzomxlbqnl';
const password = 'Eyad**1996**Eyad';
const database = 'postgres';

const client = new pg.Client({
  host: host,
  port: 5432, // Session mode pooler
  user: user,
  password: password,
  database: database,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSeed() {
  console.log('Connecting to database for seeding...');
  await client.connect();
  console.log('Connected! Seeding dummy data...');

  try {
    // 1. Clean existing dummy data if any to prevent duplicates
    console.log('Clearing old catalog/seed items...');
    await client.query('DELETE FROM public.product_likes;');
    await client.query('DELETE FROM public.photo_likes;');
    await client.query('DELETE FROM public.products;');
    await client.query('DELETE FROM public.blog_posts;');
    await client.query('DELETE FROM public.gallery_photos;');
    await client.query('DELETE FROM public.reviews;');
    await client.query('DELETE FROM public.available_slots;');

    // 2. Seed Products
    console.log('Seeding premium products...');
    const products = [
      {
        name: 'عطر الحوّاري الفاخر - كلاسيك',
        description: 'عطر رجالي مميز يجمع بين الهيل، الأخشاب النادرة، والمسك الفاخر يدوم طويلاً.',
        price: 45.00,
        category: 'perfume',
        image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&q=80',
        stock: 15
      },
      {
        name: 'واكس تصفيف الشعر الاحترافي - ثبات قوي',
        description: 'يمنح شعرك مظهراً طبيعياً وثباتاً يدوم طوال اليوم دون لمعان زائد.',
        price: 18.00,
        category: 'cream',
        image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&q=80',
        stock: 25
      },
      {
        name: 'زيت اللحية الفاخر بالأرغان واللوز',
        description: 'يرطب اللحية من الجذور، ويمنع الحكة، ويمنحها لمعاناً ونعومة فائقة.',
        price: 22.50,
        category: 'cream',
        image_url: 'https://images.unsplash.com/photo-1626015276681-2b44fe07998b?w=500&q=80',
        stock: 20
      },
      {
        name: 'مجموعة أدوات الحلاقة الذهبية الكلاسيكية',
        description: 'مجموعة فاخرة مطلية باللون الذهبي تتضمن مقصاً احترافياً، شفرة حلاقة كلاسيكية، وفرشاة ناعمة.',
        price: 95.00,
        category: 'tool',
        image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&q=80',
        stock: 5
      }
    ];

    for (const prod of products) {
      await client.query(
        'INSERT INTO public.products (name, description, price, category, image_url, stock) VALUES ($1, $2, $3, $4, $5, $6)',
        [prod.name, prod.description, prod.price, prod.category, prod.image_url, prod.stock]
      );
    }

    // 3. Seed Blog Posts
    console.log('Seeding blog posts...');
    const blogs = [
      {
        title: 'أسرار العناية باللحية وتكثيفها في المنزل',
        excerpt: 'اكتشف الخطوات الأساسية للحفاظ على لحية ناعمة ومنسقة وصحية باستخدام الزيوت الطبيعية.',
        content: 'العناية باللحية تتطلب روتينًا يوميًا بسيطًا ولكنه فعال. أولاً، غسل اللحية باستخدام شامبو مخصص لتجنب جفاف البشرة. ثانياً، ترطيبها يومياً باستخدام زيت اللحية الفاخر الذي يحتوي على الأرغان لتغذية بصيلات الشعر. ثالثاً، تسريحها باستخدام مشط خشبي لتوزيع الزيوت الطبيعية بشكل متساوٍ...',
        image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
        tags: ['عناية', 'لحية', 'نصائح']
      },
      {
        title: 'كيف تختار قصة الشعر المناسبة لشكل وجهك؟',
        excerpt: 'دليلك الشامل لمعرفة أشكال الوجوه المختلفة وقصات الشعر التي تبرز وسامتك وجاذبيتك.',
        content: 'اختيار قصة الشعر المناسبة هو العامل الأهم في مظهرك الخارجي. للوجه الدائري، نوصي بالقصات التي تعطي حجماً من الأعلى وتقل من الجوانب لتعطي طولاً للوجه. للوجه المربع، القصات الكلاسيكية ذات الجوانب القصيرة تناسبه جداً. أما الوجه البيضاوي، فيناسبه تقريباً معظم قصات الشعر...',
        image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
        tags: ['قصات', 'موضة', 'أناقة']
      }
    ];

    for (const blog of blogs) {
      await client.query(
        'INSERT INTO public.blog_posts (title, excerpt, content, image_url, tags) VALUES ($1, $2, $3, $4, $5)',
        [blog.title, blog.excerpt, blog.content, blog.image_url, blog.tags]
      );
    }

    // 4. Seed Gallery Photos
    console.log('Seeding studio gallery photos...');
    const gallery = [
      {
        image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
        caption: 'قصة كلاسيكية أنيقة مع تدريج ناعم يعكس الفخامة والدقة.'
      },
      {
        image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
        caption: 'جلسة عناية متكاملة باللحية مع استخدام البخار والزيوت الفاخرة.'
      },
      {
        image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
        caption: 'أدواتنا الفاخرة والمعقمة الجاهزة لمنحك أفضل تجربة حلاقة.'
      },
      {
        image_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&q=80',
        caption: 'فريقنا المحترف يسعد بتقديم أعلى مستويات الخدمة والعناية الفائقة.'
      }
    ];

    for (const photo of gallery) {
      await client.query(
        'INSERT INTO public.gallery_photos (image_url, caption) VALUES ($1, $2)',
        [photo.image_url, photo.caption]
      );
    }

    // 5. Seed Available Appointment Slots for the next 7 days
    console.log('Seeding booking calendar available slots...');
    const hours = ['10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00', '19:00:00', '20:00:00'];
    
    // Generate dates for today + 7 days
    for (let i = 0; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      for (const timeStr of hours) {
        try {
          await client.query(
            'INSERT INTO public.available_slots (date, time) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [dateStr, timeStr]
          );
        } catch (slotErr) {
          // Ignore conflicts just in case
        }
      }
    }

    console.log('🎉 SUCCESS: All premium dummy data seeded beautifully into your remote Supabase database!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
