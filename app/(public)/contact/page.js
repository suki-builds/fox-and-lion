import ContactForm from '../../../components/ContactForm';

export const metadata = {
  title: 'Contact — Fox and Lion',
};

export default function ContactPage() {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <h1>Contact</h1>
      <p style={{ color: 'var(--color-text-body)', maxWidth: '680px' }}>
        Have a question or something to raise with the editorial team? Send us a message
        and we&rsquo;ll get back to you.
      </p>

      <ContactForm />
    </div>
  );
}
