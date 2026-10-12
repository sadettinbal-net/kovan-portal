// "/firma/12" gibi site içi yol mu? ("//" veya "/\\" ile başlayan dış adresler reddedilir)
export function guvenliYol(yol: string) {
  return yol.startsWith('/') && !yol.startsWith('//') && !yol.startsWith('/\\') && yol.length <= 300;
}
