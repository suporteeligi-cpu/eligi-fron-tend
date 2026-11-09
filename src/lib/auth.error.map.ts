/* =========================================================
   AUTH ERROR MAP
   code (back) -> { field?, message } pro form.
   INVALID_EMAIL / WEAK_PASSWORD / INVALID_NAME usam a
   mensagem do back (mais especifica) com fallback curto.
========================================================= */

export function mapAuthError(
  code?: string,
  serverMessage?: string,
): {
  field?: 'email' | 'password' | 'name'
  message: string
} {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return { message: 'E-mail ou senha incorretos.' }

    case 'EMAIL_ALREADY_EXISTS':
      return { field: 'email', message: 'Esse e-mail já tem conta.' }

    case 'INVALID_EMAIL':
      return { field: 'email', message: serverMessage || 'E-mail inválido.' }

    case 'EMAIL_DOMAIN_UNVERIFIABLE':
      return { field: 'email', message: serverMessage || 'Domínio não encontrado.' }

    case 'WEAK_PASSWORD':
      return { field: 'password', message: serverMessage || 'Senha muito fraca.' }

    case 'INVALID_NAME':
      return { field: 'name', message: serverMessage || 'Nome inválido.' }

    case 'INVALID_TOKEN':
      return { message: 'Link expirado. Pede um novo.' }

    case 'INVALID_REFRESH_TOKEN':
    case 'SESSION_INVALID':
    case 'SESSION_REVOKED':
    case 'SESSION_EXPIRED':
      return { message: 'Sessão expirada. Entra de novo.' }

    // @eligi:auth-err-apple-map — a mensagem do back ja diz o que fazer.
    case 'APPLE_USER_NOT_FOUND':
      return { message: serverMessage || 'Não encontramos sua conta. Entre com e-mail e senha ou com o Google.' }

    case 'APPLE_EMAIL_REQUIRED':
      return { message: serverMessage || 'A Apple não enviou seu e-mail. Tente de novo.' }

    case 'APPLE_ACCOUNT_CONFLICT':
      return { message: serverMessage || 'Esta conta já está ligada a outro ID Apple.' }

    case 'INVALID_APPLE_TOKEN':
    case 'APPLE_UNAVAILABLE':
      return { message: 'Não foi possível entrar com a Apple. Tente de novo.' }

    case 'USER_INACTIVE':
      return { message: 'Conta inativa.' }

    default:
      return { message: 'Algo deu errado. Tenta de novo.' }
  }
}
