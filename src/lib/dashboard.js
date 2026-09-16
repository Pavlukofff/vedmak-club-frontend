export const EVENT_TYPES = [
  { value: 'user_registered', label: 'Новая регистрация' },
  { value: 'displayname_request', label: 'Запрос на смену никнейма' },
  { value: 'displayname_reviewed', label: 'Заявка на никнейм рассмотрена' },
  { value: 'rank_request', label: 'Заявка на повышение ранга' },
  { value: 'rank_request_reviewed', label: 'Заявка на ранг рассмотрена' },
  { value: 'rank_changed', label: 'Изменение ранга' },
  { value: 'battle_recorded', label: 'Записан бой' },
  { value: 'monster_kill_recorded', label: 'Записано убийство монстра' },
  { value: 'currency_granted', label: 'Начислена валюта' },
  { value: 'currency_transferred', label: 'Перевод валюты' },
  { value: 'penalty_issued', label: 'Вынесено взыскание' },
  { value: 'penalty_cancelled', label: 'Отменено взыскание' },
  { value: 'title_granted', label: 'Выдан титул' },
  { value: 'title_revoked', label: 'Отозван титул' },
  { value: 'bracket_generated', label: 'Сгенерирована сетка турнира' },
  { value: 'purchase_granted', label: 'Товар выдан вручную' },
  { value: 'fundraiser_contribution', label: 'Взнос в сбор средств' },
]

export function eventTypeLabel(value) {
  return EVENT_TYPES.find((t) => t.value === value)?.label || value
}
