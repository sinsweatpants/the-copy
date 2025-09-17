export const toast = (msg: string) => {
  const div = document.createElement('div');
  div.textContent = msg;
  div.className = 'fixed top-2 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow z-50';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
};
