// @eligi:client-photo
// Foto do cliente como fundo de CSS (sem <img>: nao exige next/image e o
// fallback das iniciais fica no mesmo elemento). So https sem caractere que
// escape do url("...").

export function photoBackground(url?: string | null): string | null {
  if (!url || !/^https:\/\/[^\s"'()<>\\]+$/.test(url)) return null
  return `center / cover no-repeat url("${url}")`
}
