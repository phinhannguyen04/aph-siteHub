import { AccountActions } from './account-actions'
import { Status } from './account-status'

export function AccountCards({ accounts, onOpen, onEdit, onDelete }) {
  return (
    <div className="account-cards">
      {accounts.map((a) => (
        <article
          key={a.id}
          className="card account-card"
          style={{ flexDirection: 'column', padding: '1rem', gap: '0.5rem' }}
        >
          <div className="row between">
            <button type="button" className="cell-link" onClick={() => onOpen(a.id)}>
              {a.login_name}
            </button>
            <Status account={a} />
          </div>
          <span className="help">
            {a.provider} · {a.email}
          </span>
          <AccountActions account={a} onEdit={onEdit} onDelete={onDelete} />
        </article>
      ))}
    </div>
  )
}
