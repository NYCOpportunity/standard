import Cleave from 'cleave.js';

class MaskPhone {
  constructor() {
    let phones = document.querySelectorAll('[data-js="tel"]');

    for (let i = 0; i < phones.length; i++) {
      new Cleave(phones[i], {
        numericOnly: true,
        blocks: [0, 3, 0, 3, 4],
        delimiters: ['(', ')', ' ', '-']
      });
    }
  }
}

export default MaskPhone;
