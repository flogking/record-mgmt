// 销管榜称号体系
export const RANK_TITLES = [
  { rank: 1, title: '销冠之王', emoji: '\u{1F451}', bg: 'linear-gradient(135deg, #FFD700, #FFA500)', textColor: '#8B4513' },
  { rank: 2, title: '业绩猛虎', emoji: '\u{1F42F}', bg: 'linear-gradient(135deg, #E8E8E8, #C0C0C0)', textColor: '#444' },
  { rank: 3, title: '潜力股新星', emoji: '\u{1F31F}', bg: 'linear-gradient(135deg, #FFDAB9, #CD853F)', textColor: '#5C3317' },
  { rank: 4, title: '闷声发大财', emoji: '\u{1F92B}', bg: '#ffffff', textColor: '#333', border: '1px solid #e8e8e8' },
  { rank: 5, title: '就差一点点', emoji: '\u{1F624}', bg: '#ffffff', textColor: '#333', border: '1px solid #e8e8e8' },
]

export const TAUNT_QUOTES = [
  '\u{1F402} 大佬，带带我！',
  '\u{1F4AA} 这业绩，老板看了都流泪',
  '\u{1F525} 再冲一把，就能把隔壁老王踩下去了',
  '\u{1F60E} 这就是传说中的躺赢吗？',
  '\u{1F680} 火箭速度，追都追不上',
  '\u{1F92F} 这金额，我数学不好数不清了',
  '\u{1F440} 悄悄问，客户是不是你家亲戚？',
  '\u{1F4B8} 赚钱的速度比印钞机还快',
  '\u{1F3C3}\u200D\u2642\uFE0F 后面的人快追啊，别让他跑了',
  '\u{1F3AF} 精准命中，弹无虚发',
]

export function getRandomQuote(): string {
  return TAUNT_QUOTES[Math.floor(Math.random() * TAUNT_QUOTES.length)]
}

export function getRankStyle(rank: number) {
  const style = RANK_TITLES[rank - 1]
  if (!style) return { title: '', emoji: '', bg: '#fff', textColor: '#333', border: '1px solid #e8e8e8' }
  return style
}
