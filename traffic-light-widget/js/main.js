'use strict';
(function () {
  // <object> tag containing the corresponding svg
  const content = document.getElementById("content");
  // <h4> tag containing the content description displayed below the traffic light
  const description = document.getElementById("contentDescription");

  function setContentData(red) {
    if (red) {
      content.data = 'images/red-button.svg';
      description.textContent = MashupPlatform.prefs.get('desc-true');
    } else {
      content.data = 'images/green-button.svg';
      description.textContent = MashupPlatform.prefs.get('desc-false');
    };
  }

  MashupPlatform.wiring.registerCallback('flagInput', setContentData);
})();