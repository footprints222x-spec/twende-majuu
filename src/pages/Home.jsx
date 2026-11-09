import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { homePathFor, useAuth } from '../context/AuthContext';

const ROLES = [
  {
    img: 'crew-chef',
    name: 'Head and sous chefs',
    alt: 'A chef in white jacket and tall hat standing beside a ship buffet',
  },
  {
    img: 'crew-kitchen',
    name: 'Specialty kitchens',
    alt: 'A chef in a black jacket and mask serving a plate of sushi',
  },
  {
    img: 'crew-stewardess',
    name: 'Stewardesses',
    alt: 'A stewardess in a white uniform folding a napkin at a dining table',
  },
  {
    img: 'crew-engineer',
    name: 'Engineering',
    alt: 'An engineer wearing a face shield and gloves testing equipment in an engine space',
  },
  {
    img: 'crew-dining',
    name: 'Dining room',
    alt: 'A waiter in a waistcoat laying a table in a ship restaurant',
  },
];

const STEPS = [
  ['Create your account', 'Add your name, email and a password. It takes about a minute.'],
  ['Complete your profile', 'Passport details, the position you want and your experience.'],
  ['Upload your documents', 'CV, passport photograph, passport copy and any certificates.'],
  ['Follow your application', 'Log in any time to see where your application stands.'],
];

const DOCS = [
  ['CV or resume', 'PDF or DOCX'],
  ['Passport photograph', 'JPG or PNG'],
  ['Passport copy', 'PDF, JPG or PNG'],
  ['Professional and maritime training certificates', 'PDF, JPG or PNG'],
];

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero on-dark" aria-labelledby="hero-title">
        <div className="hero__grid">
          <div className="hero__copy">
            <h1 id="hero-title" className="hero__title">
              <span>Twende</span>
              <span>majuu.</span>
            </h1>
            <p className="hero__meaning">Swahili for “let’s move forward.”</p>
            <p className="hero__lead">
              Register once for crew work on cruise ships, yachts and offshore vessels. Upload your documents, then
              follow your application from your phone or your computer.
            </p>
            <div className="hero__actions">
              {user ? (
                <Link to={homePathFor(user)} className="btn btn--primary btn--lg">
                  Go to my account
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn--primary btn--lg">
                    Create your profile
                  </Link>
                  <Link to="/login" className="btn btn--ghost-light btn--lg">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero__media">
            <img
              src="/images/ship-aerial.webp"
              alt="A cruise ship seen from directly above, its bow and forward deck pool on dark blue water"
              width="1000"
              height="1000"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="roles-title">
        <div className="container">
          <div className="section__head">
            <h2 id="roles-title">Every role on board</h2>
            <p>
              Chefs, stewards, engineers, deck crew, housekeepers and captains all register the same way.
            </p>
          </div>
        </div>
        <div className="container container--bleed-mobile">
          <ul className="roles">
            {ROLES.map((r) => (
              <li key={r.img}>
                <figure className="role">
                  <img src={`/images/${r.img}.webp`} alt={r.alt} width="500" height="667" loading="lazy" decoding="async" />
                  <figcaption>{r.name}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="how-title">
        <div className="container">
          <div className="section__head">
            <h2 id="how-title">From sign-up to shortlist in four steps</h2>
          </div>
          <ol className="steps">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="step">
                <span className="step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="docs-title">
        <div className="container split">
          <div>
            <h2 id="docs-title">Have these ready</h2>
            <p className="split__lead">
              You can add documents any time after you register, from a phone camera or from files on your computer.
            </p>
            <p className="privacy-note">
              <Icon name="check" size={20} />
              <span>Your documents are stored privately. Only you and the review team can open them.</span>
            </p>
          </div>
          <ul className="doc-list">
            {DOCS.map(([name, formats]) => (
              <li key={name}>
                <Icon name="file" size={24} />
                <span className="doc-list__name">{name}</span>
                <span className="doc-list__formats">{formats}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="cta-title">
        <div className="container cta">
          <img
            src="/images/superyacht.webp"
            alt="A large superyacht cruising past a green island in turquoise water"
            width="900"
            height="450"
            loading="lazy"
            decoding="async"
          />
          <div className="cta__copy">
            <h2 id="cta-title">Cruise ships, superyachts and offshore vessels</h2>
            <p>One profile covers them all. Start now and finish whenever you are ready.</p>
            <Link to={user ? homePathFor(user) : '/register'} className="btn btn--dark btn--lg">
              {user ? 'Go to my account' : 'Create your profile'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
