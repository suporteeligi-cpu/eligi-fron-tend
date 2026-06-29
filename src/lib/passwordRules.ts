// Regras de senha — fonte ÚNICA (submit do RegisterForm + PasswordChecklist).
// Mexer aqui muda os dois ao mesmo tempo: nunca divergem.

export interface PasswordRule {
  id: string
  label: string   // rótulo curto (checklist)
  error: string   // mensagem do submit (idêntica à validação antiga)
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'len',    label: 'Mínimo 8 caracteres', error: 'Mínimo 8 caracteres.',      test: (p) => p.length >= 8 },
  { id: 'upper',  label: '1 letra maiúscula',   error: 'Inclua 1 letra maiúscula.', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: '1 número',            error: 'Inclua 1 número.',          test: (p) => /[0-9]/.test(p) },
]

/** Primeira regra que falha -> mensagem pro submit. null = senha válida. */
export function firstPasswordError(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.error
  }
  return null
}

/** Senha satisfaz todas as regras. */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}
