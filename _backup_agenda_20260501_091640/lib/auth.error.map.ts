export function mapAuthError(code?: string): {
  field?: 'email' | 'password'
  message: string
} {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return {
        message: 'E-mail ou senha inválidos'
      }

    case 'EMAIL_ALREADY_EXISTS':
      return {
        field: 'email',
        message: 'Este e-mail já está cadastrado'
      }

    case 'WEAK_PASSWORD':
      return {
        field: 'password',
        message: 'Senha muito fraca'
      }

    case 'USER_INACTIVE':
      return {
        message: 'Usuário inativo'
      }

    default:
      return {
        message: 'Ocorreu um erro inesperado'
      }

    case 'INVALID_REFRESH_TOKEN':
      return {
        message: 'Sessão inválida. Faça login novamente.'
     }

    case 'SESSION_INVALID':
    case 'SESSION_REVOKED':
    case 'SESSION_EXPIRED':
      return {
        message: 'Sua sessão expirou. Faça login novamente.'
      }
  
  }

}
