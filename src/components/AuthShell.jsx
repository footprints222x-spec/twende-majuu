/** Form on the left, photo on the right (desktop). On phones only the form shows. */
export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="auth__form">
        <div className="auth__inner">{children}</div>
      </div>
      <aside className="auth__media" aria-hidden="true">
        <img src="/images/ship-aerial.webp" alt="" width="1000" height="1000" />
      </aside>
    </div>
  );
}
