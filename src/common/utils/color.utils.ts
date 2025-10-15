export function generateRandomColor(): string {
  const randomColor = Math.floor(Math.random() * 16777215);
  return '#' + randomColor.toString(16).padStart(6, '0').toUpperCase();
}

