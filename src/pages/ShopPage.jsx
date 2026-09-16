import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { categoryLabel, formatEffect } from '../lib/shop'

const TABS = [{ value: 'all', label: 'Все' }, { value: 'general', label: 'Обычные' }, { value: 'potion', label: 'Зелья' }, { value: 'scroll', label: 'Свитки' }]

export default function ShopPage() {
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [purchases, setPurchases] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [grantOpenId, setGrantOpenId] = useState(null)
  const [grantTarget, setGrantTarget] = useState('')
  const [confirmUseId, setConfirmUseId] = useState(null)

  function load() {
    setLoading(true)
    const calls = [api.get('/shop/items/')]
    if (isAuthenticated) {
      calls.push(api.get('/shop/purchases/'), api.get('/accounts/users/'))
    }
    Promise.all(calls)
      .then(([i, p, u]) => {
        setItems(i.data)
        setPurchases(p?.data || [])
        setUsers(u?.data || [])
      })
      .catch(() => setError('Не удалось загрузить магазин.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [isAuthenticated])

  const filteredItems = useMemo(
    () => (category === 'all' ? items : items.filter((i) => i.category === category)),
    [items, category],
  )

  const myPurchases = useMemo(
    () => (user ? purchases.filter((p) => p.user === user.username) : []),
    [purchases, user],
  )

  // Без права can_grant_items бэкенд отдаёт только свои покупки — чужие в ответе
  // выдают наличие права (тот же приём, что и в TasksPage/RanksPage).
  const canManage = useMemo(
    () => Boolean(user) && purchases.some((p) => p.user !== user.username),
    [purchases, user],
  )

  const usersByName = useMemo(() => {
    const map = {}
    users.forEach((u) => {
      map[u.username] = u.display_name
    })
    return map
  }, [users])

  async function buy(itemId) {
    setBusyId(itemId)
    setError('')
    try {
      await api.post('/shop/purchases/', { item: itemId })
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function grant(itemId) {
    if (!grantTarget) return
    setError('')
    try {
      await api.post('/shop/purchases/', { item: itemId, user: grantTarget })
      setGrantOpenId(null)
      setGrantTarget('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function markUsed(purchaseId) {
    setConfirmUseId(null)
    setError('')
    try {
      await api.patch(`/shop/purchases/${purchaseId}/`, { is_used: true })
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Магазин</h1>
      <p className="text-sm text-muted mb-6">
        Общий магазин и Лавка алхимика — эффекты зелий и свитков справочные, для живой отыгровки.
        У части эликсиров нет фиксированной цены — их нужно заказать у мастера-алхимика лично.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      <div className="flex gap-1 border-b border-border-soft mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setCategory(t.value)}
            className={`px-3.5 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              category === t.value ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="mb-10">
        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-muted">Товаров нет.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((it) => {
              const out = it.stock === 0
              const insufficientBalance = user && it.price != null && user.balance < it.price

              return (
                <div key={it.id} className="border border-border-soft rounded-lg p-4 bg-surface flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-medium">{it.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-accent-soft text-accent-ink">
                      {categoryLabel(it.category)}
                    </span>
                  </div>

                  {it.description && (
                    <p className="text-xs text-ink-soft leading-relaxed mb-2">{it.description}</p>
                  )}

                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mb-2 text-xs text-faint">
                    {it.min_rank && <span>мин. ранг: {it.min_rank}</span>}
                    {it.toxicity && <span>токсичность: {it.toxicity}</span>}
                    {it.stock != null && <span>остаток: {it.stock}</span>}
                  </div>

                  {it.effects.length > 0 && (
                    <ul className="text-xs text-ink-soft space-y-0.5 mb-3">
                      {it.effects.map((eff) => (
                        <li key={eff.id}>{formatEffect(eff)}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto pt-2 text-sm font-mono text-accent-ink">
                    {it.price != null ? `${it.price} крон` : 'цена не фиксирована'}
                  </div>

                  {isAuthenticated && (
                    <div className="flex items-center gap-2 flex-wrap mt-2.5 pt-2.5 border-t border-border-soft">
                      {it.price != null ? (
                        <button
                          onClick={() => buy(it.id)}
                          disabled={busyId === it.id || out || insufficientBalance}
                          className="text-xs bg-accent text-bg font-medium rounded-md px-3 py-1.5 disabled:opacity-50"
                        >
                          {busyId === it.id
                            ? 'Покупаем…'
                            : out
                              ? 'Нет в наличии'
                              : insufficientBalance
                                ? 'Не хватает кронов'
                                : 'Купить'}
                        </button>
                      ) : (
                        <span className="text-xs text-faint">обратитесь к мастеру-алхимику</span>
                      )}
                      {canManage && (
                        <button
                          onClick={() => {
                            setGrantOpenId(grantOpenId === it.id ? null : it.id)
                            setGrantTarget('')
                          }}
                          className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink"
                        >
                          {grantOpenId === it.id ? 'Отмена' : 'Выдать'}
                        </button>
                      )}
                    </div>
                  )}

                  {grantOpenId === it.id && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border-soft">
                      <select
                        className={`${inputClass} text-xs py-1.5`}
                        value={grantTarget}
                        onChange={(e) => setGrantTarget(e.target.value)}
                      >
                        <option value="" disabled>
                          Кому…
                        </option>
                        {users.map((u) => (
                          <option key={u.username} value={u.username}>
                            {u.display_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => grant(it.id)}
                        disabled={!grantTarget}
                        className="text-xs bg-accent text-bg font-medium rounded-md px-3 py-1.5 whitespace-nowrap disabled:opacity-50"
                      >
                        Выдать
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {isAuthenticated && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-ink-soft mb-3">Мои покупки</h2>
          {myPurchases.length === 0 ? (
            <p className="text-sm text-muted">Пока ничего нет.</p>
          ) : (
            <ul className="space-y-2 max-w-2xl">
              {myPurchases.map((p) => (
                <li
                  key={p.id}
                  className="border border-border-soft rounded-md px-3.5 py-3 text-sm flex items-center justify-between gap-2 flex-wrap"
                >
                  <div>
                    <span className="font-medium">{p.item.name}</span>
                    {p.granted_by ? (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal-soft text-teal">
                        выдано: {p.granted_by}
                      </span>
                    ) : (
                      <span className="ml-2 text-xs text-faint">{p.price_paid} крон</span>
                    )}
                    <p className="text-xs text-faint mt-1">
                      получено {new Date(p.purchased_at).toLocaleDateString('ru-RU')}
                      {p.is_used &&
                        p.used_at &&
                        ` · использовано ${new Date(p.used_at).toLocaleDateString('ru-RU')}`}
                    </p>
                  </div>
                  {p.is_used ? (
                    <span className="text-xs text-faint shrink-0">использовано</span>
                  ) : confirmUseId === p.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-faint">необратимо, точно?</span>
                      <button
                        onClick={() => markUsed(p.id)}
                        className="text-xs bg-accent text-bg font-medium rounded-md px-2.5 py-1"
                      >
                        Да
                      </button>
                      <button
                        onClick={() => setConfirmUseId(null)}
                        className="text-xs text-faint hover:text-ink"
                      >
                        Нет
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmUseId(p.id)}
                      className="text-xs text-faint hover:text-ink shrink-0"
                    >
                      Отметить использованным
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canManage && (
        <section>
          <h2 className="text-sm font-medium text-ink-soft mb-3">Все покупки</h2>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted">Покупок ещё не было.</p>
          ) : (
            <ul className="space-y-2 max-w-2xl">
              {purchases.map((p) => (
                <li
                  key={p.id}
                  className="border border-border-soft rounded-md px-3.5 py-3 text-sm flex items-center justify-between gap-2 flex-wrap"
                >
                  <div>
                    <Link to={`/u/${p.user}`} className="font-medium hover:text-accent-ink">
                      {usersByName[p.user] || p.user}
                    </Link>
                    <span className="text-ink-soft"> — {p.item.name}</span>
                    <p className="text-xs text-faint mt-1">
                      {new Date(p.purchased_at).toLocaleDateString('ru-RU')}
                      {p.granted_by && ` · выдал: ${p.granted_by}`}
                    </p>
                  </div>
                  <span className="text-xs text-faint shrink-0">
                    {p.is_used ? 'использовано' : 'в инвентаре'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
