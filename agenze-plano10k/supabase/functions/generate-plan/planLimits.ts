/** Limites semanais de carga conforme disponibilidade (índice da pergunta q28). */
export interface WeeklyLimits {
  aulasMin: number
  aulasMax: number
  implsMin: number
  implsMax: number
}

export function getWeeklyLimits(horasDisponiveisIndex: number): WeeklyLimits {
  switch (horasDisponiveisIndex) {
    case 0:
      return { aulasMin: 3, aulasMax: 5, implsMin: 3, implsMax: 6 }
    case 1:
      return { aulasMin: 4, aulasMax: 7, implsMin: 4, implsMax: 8 }
    case 2:
      return { aulasMin: 5, aulasMax: 8, implsMin: 5, implsMax: 10 }
    default:
      return { aulasMin: 6, aulasMax: 9, implsMin: 6, implsMax: 12 }
  }
}
