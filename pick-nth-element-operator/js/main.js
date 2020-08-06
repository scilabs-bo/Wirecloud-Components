'use strict';
(function () {
  MashupPlatform.wiring.registerCallback('arrayInput', function (array) {
    let index = MashupPlatform.prefs.get('index');
    if (Array.isArray(array) && array.length > index) {
      MashupPlatform.wiring.pushEvent('elementOutput', array[index]);
    } else {
      console.error('[pick-nth-element] Input is not an array or the array length is less or equal to the provided index');
    }
  });
})();
