const REQUIREMENT_LABELS = {
  level: 'Уровень',
  wins_vs_rank: 'Победы над рангом',
  rpg_wins: 'РПГ-победы',
  journeyman_count: 'Подмастерья',
  master_count: 'Мастера',
  trial: 'Испытание',
  monster_trophies: 'Трофеи с монстров',
  quest_lines: 'Квестовые линии',
  custom: 'Другое',
}

const REWARD_LABELS = {
  item: 'Предмет',
  discount: 'Скидка',
  board_placement: 'Место на доске почёта',
  title: 'Титул',
  slot: 'Слот',
  custom: 'Другое',
}

function requirementBaseText(req) {
  switch (req.type) {
    case 'level':
      return `Уровень ${req.value}`
    case 'wins_vs_rank':
      return req.target_rank
        ? `${req.value} побед над рангом «${req.target_rank}» и выше`
        : `${req.value} побед`
    case 'rpg_wins':
      return `${req.value} РПГ-побед`
    case 'journeyman_count':
      return `${req.value} подмастерьев`
    case 'master_count':
      return `${req.value} мастеров`
    case 'monster_trophies':
      return `${req.value} трофеев с монстров`
    case 'quest_lines':
      return `${req.value} квестовых линий`
    default:
      return null
  }
}

export function formatRequirement(req) {
  const base = requirementBaseText(req)
  if (base && req.description) return `${base} (${req.description})`
  return base || req.description || REQUIREMENT_LABELS[req.type] || req.type
}

function rewardBaseText(reward) {
  switch (reward.type) {
    case 'discount':
      return reward.value ? `Скидка ${reward.value}` : null
    case 'title':
      return reward.value ? `Титул «${reward.value}»` : null
    default:
      return reward.value || null
  }
}

export function formatReward(reward) {
  const base = rewardBaseText(reward)
  if (base && reward.description) return `${base} — ${reward.description}`
  return base || reward.description || REWARD_LABELS[reward.type] || reward.type
}
