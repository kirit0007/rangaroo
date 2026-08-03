import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container section-padding">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="current">About Us</span>
      </div>

      <div className="about-hero text-center" style={{ padding: '4rem 0' }}>
        <h1 className="h1 text-primary">About Rangaroo 🦘</h1>
        <p className="subtitle" style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.2rem', lineHeight: '1.6' }}>
          Rangaroo is an Indian DIY arts & crafts brand dedicated to inspiring creativity, imagination, and joyful learning through hands-on painting experiences.
        </p>
      </div>

      <div className="about-content" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '800px', margin: '0 auto' }}>
        <section className="card">
          <h2 className="h2 text-secondary">Our Story</h2>
          <p>
            Our thoughtfully designed DIY Paint Kits encourage children and families to step away from screens and enjoy quality creative time together. We believe that every child is an artist, and our kits are made to bring out their colorful imaginations.
          </p>
        </section>

        <section className="card">
          <h2 className="h2 text-accent">Our Mission & Vision</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div>
              <h3 className="h3">Mission</h3>
              <p>To bring happiness, creativity, and meaningful play into every home by making art fun, accessible, and memorable for every child.</p>
            </div>
            <div>
              <h3 className="h3">Vision</h3>
              <p>To become one of India's most loved DIY creative brands, inspiring millions of children to paint, create, imagine, and learn through hands-on experiences.</p>
            </div>
          </div>
        </section>

        <section className="card text-center" style={{ backgroundColor: 'var(--color-yellow-light)', borderColor: 'var(--color-secondary)' }}>
          <h2 className="h2 text-primary">Meet Rangoo! 🦘🎨</h2>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
            Meet Rangoo, the cheerful creative kangaroo who loves colors, imagination, and adventure. With a paintbrush tucked behind one ear and colorful paints in its pouch, Rangoo inspires children to explore their artistic side.
          </p>
        </section>

        <section>
          <h2 className="h2 text-center" style={{ marginBottom: '2rem' }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {['Creative', 'Fun', 'Colorful', 'Educational', 'Family-friendly', 'Premium yet Affordable', 'Safe & Engaging'].map((value, i) => (
              <div key={i} className="card text-center" style={{ padding: '1rem' }}>
                <strong style={{ color: 'var(--color-primary)' }}>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center" style={{ marginTop: '2rem' }}>
          <Link href="/contact" className="btn btn-primary">Get in Touch</Link>
          <Link href="/shop" className="btn btn-outline" style={{ marginLeft: '1rem' }}>Shop Now</Link>
        </div>
      </div>
    </div>
  );
}
