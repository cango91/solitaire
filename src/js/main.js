window.tryFlipping = function(card, cardClass, oldClass='back') {
    card.classList.add('flipping-first-half');
    setTimeout(function() {
      card.classList.remove(oldClass);
      card.classList.remove('flipping-first-half')
      card.classList.add(cardClass);
      card.classList.add('flipping-second-half')
      setTimeout(function() {
        card.classList.remove('flipping-second-half');
      }, 500);
    }, 250);
  }

//   window.tryFlippingAlt = function(card, cardClass, oldClass='back') {
//     card.classList.add('flipping');
//     setTimeout(function() {
//       card.classList.remove(oldClass);
//       card.classList.add(cardClass);
//       setTimeout(function() {
//         card.classList.remove('flipping');
//       }, 500);
//     }, 250);
//   }