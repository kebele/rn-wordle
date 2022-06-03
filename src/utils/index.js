// * gelen array'i gelen rows'a göre kopyalayıp gelen rows'u ekleyip rows array'ı yapan func
export const copyArray = (arr) => {
  return [...arr.map((rows) => [...rows])];
};

//* WORD
//* kelimeyi seçmenin en kolay yolu words adında bir aray yapıp random seçtirmek, gerçek wordle da sıradan seçiyor galiba günlük seçiyor, burada da yılın kaçıncı günündeyizi hesaplıyor ve o güne words arraıinde karşılık gelen kelimeyi günün kelimesi yapıyor, o yüzden davsa bir words listesi hazırladık, bunu sonra modifiye ederiz,
export const getDayOfTheYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  console.log("day of the year: " + day);
  return day;
};

export const getDayKey = () => {
  const d = new Date();
  let year = d.getFullYear();
  return `day-${getDayOfTheYear()}-${year}`;
};
