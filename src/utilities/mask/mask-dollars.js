import Cleave from 'cleave.js';

class MaskDollars {
  constructor() {
    let dollars = document.querySelectorAll('[data-js="dollars"]');

    for (let i = 0; i < dollars.length; i++) {
      new Cleave(dollars[i], {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand'
      });

      dollars[i].addEventListener('blur', event => {
        let value = event.target.value;
        let postfix = '';

        if (`${value}`.indexOf('.') > -1) {
          let split = `${value}`.split('.');

          postfix = (split[1].length == 1) ? '0' : postfix;
          postfix = (split[1].length == 0) ? '00' : postfix;
          value += postfix;
        } else if (value != '') {
          value += '.00';
        }

        event.target.value = value;
      });
    }
  }
}

export default MaskDollars;
